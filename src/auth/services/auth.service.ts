import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../../users/services/users.service';
import { RolesService } from '../../users/services/roles.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly rolesService: RolesService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Inicia sesión de un usuario
     */
    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Usuario inactivo. Contacte al administrador');
        }

        return this.generateAuthResponse(user);
    }

    /**
     * Registra un nuevo usuario (paciente por defecto)
     */
    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        // Verificar que el email no exista
        const emailExists = await this.usersService.emailExists(registerDto.email);
        if (emailExists) {
        throw new ConflictException('El email ya está registrado');
        }

        // Obtener el rol de PATIENT por defecto
        const patientRole = await this.rolesService.findByName('PATIENT');

        // Crear el usuario
        const user = await this.usersService.create({
        ...registerDto,
        roleId: patientRole.id,
        });

        return this.generateAuthResponse(user);
    }

    /**
     * Valida las credenciales del usuario
     */
    async validateUser(email: string, password: string): Promise<any> {
        try {
            const user = await this.usersService.findByEmail(email, true);
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

            if (isPasswordValid) {
                const { passwordHash, ...result } = user;
                return result;
            }
        } catch (error) {
            return null;
        }
            return null;
    }

    /**
     * Genera la respuesta de autenticación con el token
     */
    private generateAuthResponse(user: any): AuthResponseDto {
        const payload = {
        sub: user.id,
        email: user.email,
        role: user.role?.name || user.roleId,
        };

        const accessToken = this.jwtService.sign(payload);

        return {
        accessToken,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role?.name || user.roleId,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
        },
        };
    }

    /**
     * Verifica y decodifica un token JWT
     */
    async verifyToken(token: string): Promise<any> {
        try {
        return this.jwtService.verify(token);
        } catch (error) {
        throw new UnauthorizedException('Token inválido o expirado');
        }
    }

    /**
     * Obtiene el perfil del usuario autenticado
     */
    async getProfile(userId: string): Promise<any> {
        const user = await this.usersService.findById(userId);
        const { passwordHash, ...profile } = user as any;
        return profile;
    }

    /**
     * Cambia la contraseña del usuario autenticado
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<{ message: string }> {
            await this.usersService.changePassword(userId, {
                currentPassword,
                newPassword,
                confirmPassword: newPassword,
        });

        return { message: 'Contraseña actualizada exitosamente' };
    }

    /**
     * Solicita reseteo de contraseña (enviar email)
     */
    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(email);

        // Aquí implementarías el envío de email con el token
        // Por ahora solo retornamos un mensaje
        
        return {
        message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
        };
    }

    /**
     * Resetea la contraseña con un token
     */
    async resetPassword(
        token: string,
        newPassword: string,
    ): Promise<{ message: string }> {
        // Aquí verificarías el token y actualizarías la contraseña
        // Por ahora es un placeholder
        
        throw new BadRequestException('Funcionalidad de reset no implementada aún');
    }

    /**
     * Cierra sesión (invalidar token - requiere implementación adicional)
     */
    async logout(userId: string): Promise<{ message: string }> {
        // En una implementación completa, aquí invalidarías el token
        // usando una blacklist en Redis o similar
        
        return { message: 'Sesión cerrada exitosamente' };
    }

    /**
     * Refresca el token de acceso
     */
    async refreshToken(userId: string): Promise<{ accessToken: string }> {
        const user = await this.usersService.findById(userId);

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role?.name,
        };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}