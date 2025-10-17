import { 
    Injectable, 
    NotFoundException, 
    ConflictException,
    OnModuleInit,
    BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dtos/roles/create-role.dto';
import { UpdateRoleDto } from '../dtos/roles/update-role.dto';

@Injectable()
export class RolesService implements OnModuleInit {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {}

    async onModuleInit() {
        await this.createDefaultRoles();
    }

    /**
     * Crea los roles por defecto del sistema
     * @private
     */
    private async createDefaultRoles(): Promise<void> {
        const defaultRoles = [
        { name: 'ADMIN', description: 'Administrador del sistema con acceso completo' },
        { name: 'DOCTOR', description: 'Médico especialista' },
        { name: 'PATIENT', description: 'Paciente del sistema' }
        ];

        for (const roleData of defaultRoles) {
        const existingRole = await this.roleRepository.findOne({ 
            where: { name: roleData.name } 
        });
        
        if (!existingRole) {
            const role = this.roleRepository.create(roleData);
            await this.roleRepository.save(role);
            console.log(`✅ Role ${roleData.name} creado automáticamente`);
        }
        }
    }

    /**
     * Crea un nuevo rol
     * @param createRoleDto - Datos del rol a crear
     * @returns El rol creado
     * @throws ConflictException si el nombre del rol ya existe
     */
    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        // Verificar que el nombre del rol no exista
        const existingRole = await this.roleRepository.findOne({
        where: { name: createRoleDto.name.toUpperCase() }
        });

        if (existingRole) {
        throw new ConflictException(`El rol ${createRoleDto.name} ya existe`);
        }

        // Crear el rol (convertir nombre a mayúsculas)
        const role = this.roleRepository.create({
        ...createRoleDto,
        name: createRoleDto.name.toUpperCase()
        });

        return await this.roleRepository.save(role);
    }

    /**
     * Obtiene todos los roles del sistema
     * @returns Lista de todos los roles
     */
    async findAll(): Promise<Role[]> {
        return await this.roleRepository.find({
        order: { name: 'ASC' }
        });
    }

    /**
     * Obtiene un rol por su ID
     * @param id - ID del rol
     * @returns El rol encontrado
     * @throws NotFoundException si el rol no existe
     */
    async findById(id: string): Promise<Role> {
        const role = await this.roleRepository.findOne({ 
        where: { id },
        relations: ['users'] // Incluye los usuarios con ese rol
        });
        
        if (!role) {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
        }
        
        return role;
    }

    /**
     * Obtiene un rol por su nombre
     * @param name - Nombre del rol (ADMIN, DOCTOR, PATIENT)
     * @returns El rol encontrado
     * @throws NotFoundException si el rol no existe
     */
    async findByName(name: string): Promise<Role> {
        const role = await this.roleRepository.findOne({ 
        where: { name: name.toUpperCase() } 
        });
        
        if (!role) {
        throw new NotFoundException(`Rol ${name} no encontrado`);
        }
        
        return role;
    }

    /**
     * Actualiza un rol existente
     * @param id - ID del rol a actualizar
     * @param updateRoleDto - Datos a actualizar
     * @returns El rol actualizado
     * @throws NotFoundException si el rol no existe
     * @throws ConflictException si se intenta cambiar a un nombre que ya existe
     * @throws BadRequestException si se intenta modificar un rol del sistema
     */
    async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.findById(id);

        // Proteger roles del sistema
        const systemRoles = ['ADMIN', 'DOCTOR', 'PATIENT'];
        if (systemRoles.includes(role.name)) {
        throw new BadRequestException(
            `No se puede modificar el rol ${role.name} porque es un rol del sistema`
        );
        }

        // Si se intenta cambiar el nombre, verificar que no exista
        if (updateRoleDto.name && updateRoleDto.name.toUpperCase() !== role.name) {
        const existingRole = await this.roleRepository.findOne({
            where: { name: updateRoleDto.name.toUpperCase() }
        });

        if (existingRole) {
            throw new ConflictException(`El rol ${updateRoleDto.name} ya existe`);
        }

        updateRoleDto.name = updateRoleDto.name.toUpperCase();
        }

        Object.assign(role, updateRoleDto);
        return await this.roleRepository.save(role);
    }

    /**
     * Elimina un rol del sistema
     * @param id - ID del rol a eliminar
     * @throws NotFoundException si el rol no existe
     * @throws BadRequestException si el rol es del sistema o tiene usuarios asignados
     */
    async delete(id: string): Promise<void> {
        const role = await this.findById(id);

        // Proteger roles del sistema
        const systemRoles = ['ADMIN', 'DOCTOR', 'PATIENT'];
        if (systemRoles.includes(role.name)) {
        throw new BadRequestException(
            `No se puede eliminar el rol ${role.name} porque es un rol del sistema`
        );
        }

        // Verificar que no tenga usuarios asignados
        if (role.users && role.users.length > 0) {
        throw new BadRequestException(
            `No se puede eliminar el rol porque tiene ${role.users.length} usuario(s) asignado(s)`
        );
        }

        await this.roleRepository.remove(role);
    }

    /**
     * Cuenta la cantidad de usuarios por rol
     * @param id - ID del rol
     * @returns Cantidad de usuarios con ese rol
     */
    async countUsersByRole(id: string): Promise<number> {
        const role = await this.findById(id);
        return role.users ? role.users.length : 0;
    }

    /**
     * Verifica si un rol existe por su nombre
     * @param name - Nombre del rol
     * @returns true si existe, false si no
     */
    async existsByName(name: string): Promise<boolean> {
        const role = await this.roleRepository.findOne({
        where: { name: name.toUpperCase() }
        });
        return !!role;
    }

    /**
     * Obtiene los IDs de los roles del sistema por nombre
     * Útil para asignar roles al crear usuarios
     */
    async getRoleIdByName(name: 'ADMIN' | 'DOCTOR' | 'PATIENT'): Promise<string> {
        const role = await this.findByName(name);
        return role.id;
    }
}