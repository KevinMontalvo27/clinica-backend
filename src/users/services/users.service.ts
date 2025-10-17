import { 
    Injectable, 
    NotFoundException, 
    ConflictException,
    BadRequestException,
    UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/users.entity';
import { CreateUserDto } from '../dtos/users/create-user.dto';
import { UpdateUserDto } from '../dtos/users/update-user.dto';
import { ChangePasswordDto } from '../dtos/users/change-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    /**
     * Crea un nuevo usuario
     * @param createUserDto - Datos del usuario a crear
     * @returns El usuario creado
     * @throws ConflictException si el email ya existe
     */
    async create(createUserDto: CreateUserDto): Promise<User> {
        // Verificar que el email no exista
        const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email.toLowerCase() }
        });

        if (existingUser) {
        throw new ConflictException(`El email ${createUserDto.email} ya está registrado`);
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(createUserDto.password, 10);

        // Crear usuario (sin incluir password en el objeto)
        const { password, ...userData } = createUserDto;
        
        const user = this.userRepository.create({
        ...userData,
        email: userData.email.toLowerCase(),
        passwordHash,
        });

        return await this.userRepository.save(user);
    }

    /**
     * Obtiene todos los usuarios
     * @param includeInactive - Si true, incluye usuarios inactivos
     * @returns Lista de usuarios
     */
    async findAll(includeInactive: boolean = false): Promise<User[]> {
        const whereCondition = includeInactive ? {} : { isActive: true };

        return await this.userRepository.find({
        where: whereCondition,
        relations: ['role', 'doctor', 'patient'],
        order: { createdAt: 'DESC' },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            // passwordHash NO se incluye
        }
        });
    }

    /**
     * Obtiene un usuario por su ID
     * @param id - ID del usuario
     * @param includePassword - Si true, incluye el hash de contraseña (para validación)
     * @returns El usuario encontrado
     * @throws NotFoundException si el usuario no existe
     */
    async findById(id: string, includePassword: boolean = false): Promise<User> {
        const selectOptions: any = {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        roleId: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        };

        if (includePassword) {
        selectOptions.passwordHash = true;
        }

        const user = await this.userRepository.findOne({
        where: { id },
        relations: ['role', 'doctor', 'patient'],
        select: selectOptions
        });

        if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        return user;
    }

    /**
     * Obtiene un usuario por su email
     * @param email - Email del usuario
     * @param includePassword - Si true, incluye el hash de contraseña
     * @returns El usuario encontrado
     * @throws NotFoundException si el usuario no existe
     */
    async findByEmail(email: string, includePassword: boolean = false): Promise<User> {
        const selectOptions: any = {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        roleId: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        };

        if (includePassword) {
        selectOptions.passwordHash = true;
        }

        const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
        relations: ['role', 'doctor', 'patient'],
        select: selectOptions
        });

        if (!user) {
        throw new NotFoundException(`Usuario con email ${email} no encontrado`);
        }

        return user;
    }

    /**
     * Busca usuarios por nombre o email
     * @param searchTerm - Término de búsqueda
     * @returns Lista de usuarios que coinciden
     */
    async search(searchTerm: string): Promise<User[]> {
        return await this.userRepository.find({
        where: [
            { firstName: Like(`%${searchTerm}%`) },
            { lastName: Like(`%${searchTerm}%`) },
            { email: Like(`%${searchTerm}%`) }
        ],
        relations: ['role'],
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
        }
        });
    }

    /**
     * Obtiene usuarios por rol
     * @param roleId - ID del rol
     * @returns Lista de usuarios con ese rol
     */
    async findByRole(roleId: string): Promise<User[]> {
        return await this.userRepository.find({
        where: { 
            roleId,
            isActive: true 
        },
        relations: ['role', 'doctor', 'patient'],
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
        }
        });
    }

    /**
     * Actualiza un usuario
     * @param id - ID del usuario a actualizar
     * @param updateUserDto - Datos a actualizar
     * @returns El usuario actualizado
     * @throws NotFoundException si el usuario no existe
     * @throws ConflictException si el nuevo email ya existe
     */
    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);

        // Si se intenta cambiar el email, verificar que no exista
        if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email) {
        const existingUser = await this.userRepository.findOne({
            where: { email: updateUserDto.email.toLowerCase() }
        });

        if (existingUser) {
            throw new ConflictException(`El email ${updateUserDto.email} ya está en uso`);
        }

        updateUserDto.email = updateUserDto.email.toLowerCase();
        }

        Object.assign(user, updateUserDto);
        return await this.userRepository.save(user);
    }

    /**
     * Cambia la contraseña del usuario
     * @param userId - ID del usuario
     * @param changePasswordDto - Datos del cambio de contraseña
     * @throws UnauthorizedException si la contraseña actual es incorrecta
     * @throws BadRequestException si las contraseñas no coinciden
     */
    async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
        const user = await this.findById(userId, true);

        // Verificar contraseña actual
        const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.passwordHash
        );

        if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('La contraseña actual es incorrecta');
        }

        // Verificar que las nuevas contraseñas coincidan
        if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new BadRequestException('Las contraseñas no coinciden');
        }

        // Actualizar contraseña
        user.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.userRepository.save(user);
    }

    /**
     * Desactiva un usuario (soft delete)
     * @param id - ID del usuario a desactivar
     * @returns El usuario desactivado
     */
    async deactivate(id: string): Promise<User> {
        const user = await this.findById(id);
        user.isActive = false;
        return await this.userRepository.save(user);
    }

    /**
     * Reactiva un usuario
     * @param id - ID del usuario a reactivar
     * @returns El usuario reactivado
     */
    async activate(id: string): Promise<User> {
        const user = await this.findById(id);
        user.isActive = true;
        return await this.userRepository.save(user);
    }

    /**
     * Elimina un usuario permanentemente
     * @param id - ID del usuario a eliminar
     * @throws BadRequestException si el usuario tiene relaciones críticas
     */
    async delete(id: string): Promise<void> {
        const user = await this.findById(id);

        // Verificar que no tenga relaciones críticas activas
        // Por ejemplo, citas pendientes, etc.
        // Esta lógica dependerá de tu modelo de negocio

        await this.userRepository.remove(user);
    }

    /**
     * Verifica las credenciales del usuario (para login)
     * @param email - Email del usuario
     * @param password - Contraseña a verificar
     * @returns El usuario si las credenciales son válidas
     * @throws UnauthorizedException si las credenciales son inválidas
     */
    async validateCredentials(email: string, password: string): Promise<User> {
        const user = await this.findByEmail(email, true);

        if (!user.isActive) {
        throw new UnauthorizedException('El usuario está desactivado');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
        }

        return user;
    }

    /**
     * Verifica el email del usuario
     * @param userId - ID del usuario
     */
    async verifyEmail(userId: string): Promise<User> {
        const user = await this.findById(userId);
        user.emailVerified = true;
        return await this.userRepository.save(user);
    }

    /**
     * Verifica si un email existe
     * @param email - Email a verificar
     * @returns true si existe, false si no
     */
    async emailExists(email: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() }
        });
        return !!user;
    }

    /**
     * Cuenta el total de usuarios
     * @param onlyActive - Si true, solo cuenta usuarios activos
     * @returns Cantidad de usuarios
     */
    async count(onlyActive: boolean = false): Promise<number> {
        const whereCondition = onlyActive ? { isActive: true } : {};
        return await this.userRepository.count({ where: whereCondition });
    }

    /**
     * Cuenta usuarios por rol
     * @param roleId - ID del rol
     * @returns Cantidad de usuarios con ese rol
     */
    async countByRole(roleId: string): Promise<number> {
        return await this.userRepository.count({
        where: { 
            roleId,
            isActive: true 
        }
        });
    }
}