import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    Patch,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { ChangePasswordDto } from '../../users/dtos/users/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Iniciar sesión
     * POST /api/auth/login
     */
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Iniciar sesión',
        description: 'Autentica un usuario con email y contraseña. Retorna un token JWT.',
    })
    @ApiResponse({
        status: 200,
        description: 'Login exitoso',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Credenciales inválidas',
    })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return await this.authService.login(loginDto);
    }

    /**
     * Registrar nuevo usuario
     * POST /api/auth/register
     */
    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Registrar nuevo usuario',
        description: 'Registra un nuevo usuario (paciente) en el sistema.',
    })
    @ApiResponse({
        status: 201,
        description: 'Usuario registrado exitosamente',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 409,
        description: 'El email ya está registrado',
    })
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
        return await this.authService.register(registerDto);
    }

    /**
     * Obtener perfil del usuario autenticado
     * GET /api/auth/profile
     */
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Obtener perfil',
        description: 'Retorna la información del usuario autenticado.',
    })
    @ApiResponse({
        status: 200,
        description: 'Perfil obtenido exitosamente',
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    async getProfile(@CurrentUser('id') userId: string) {
        return await this.authService.getProfile(userId);
    }

    /**
     * Cambiar contraseña
     * PATCH /api/auth/change-password
     */
    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Cambiar contraseña',
        description: 'Permite al usuario autenticado cambiar su contraseña.',
    })
    @ApiResponse({
        status: 200,
        description: 'Contraseña actualizada exitosamente',
    })
    @ApiResponse({
        status: 401,
        description: 'Contraseña actual incorrecta',
    })
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return await this.authService.changePassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
        );
    }

    /**
     * Solicitar reseteo de contraseña
     * POST /api/auth/forgot-password
     */
    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Solicitar reseteo de contraseña',
        description: 'Envía un email con instrucciones para resetear la contraseña.',
    })
    @ApiResponse({
        status: 200,
        description: 'Email enviado si el usuario existe',
    })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return await this.authService.forgotPassword(forgotPasswordDto.email);
    }

    /**
     * Resetear contraseña
     * POST /api/auth/reset-password
     */
    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Resetear contraseña',
        description: 'Resetea la contraseña usando el token recibido por email.',
    })
    @ApiResponse({
        status: 200,
        description: 'Contraseña reseteada exitosamente',
    })
    @ApiResponse({
        status: 400,
        description: 'Token inválido o expirado',
    })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
        );
    }

    /**
     * Refrescar token
     * POST /api/auth/refresh
     */
    @UseGuards(JwtAuthGuard)
    @Post('refresh')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refrescar token',
        description: 'Genera un nuevo token de acceso.',
    })
    @ApiResponse({
        status: 200,
        description: 'Token refrescado exitosamente',
    })
    async refreshToken(@CurrentUser('id') userId: string) {
        return await this.authService.refreshToken(userId);
    }

    /**
     * Cerrar sesión
     * POST /api/auth/logout
     */
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Cerrar sesión',
        description: 'Invalida el token actual del usuario.',
    })
    @ApiResponse({
        status: 200,
        description: 'Sesión cerrada exitosamente',
    })
    async logout(@CurrentUser('id') userId: string) {
        return await this.authService.logout(userId);
    }
}