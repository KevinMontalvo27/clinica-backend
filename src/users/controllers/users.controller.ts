import { 
    Controller, 
    Get, 
    Post, 
    Patch, 
    Delete,
    Body, 
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseUUIDPipe,
    ParseBoolPipe
} from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/users/create-user.dto';
import { UpdateUserDto } from '../dtos/users/update-user.dto';
import { ChangePasswordDto } from '../dtos/users/change-password.dto';
import { UserResponseDto } from '../dtos/users/user-response.dto';

@ApiTags('users')
@Controller('users')
// @ApiBearerAuth() // Descomentar cuando implementes JWT
// @UseGuards(JwtAuthGuard) // Descomentar cuando implementes guards
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    /**
     * Crear un nuevo usuario
     * POST /api/users
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Crear nuevo usuario',
        description: 'Crea un nuevo usuario en el sistema. La contraseña se hashea automáticamente.'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Usuario creado exitosamente',
        type: UserResponseDto
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El email ya está registrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Datos de entrada inválidos' 
    })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        return await this.usersService.create(createUserDto);
    }

    /**
     * Obtener todos los usuarios
     * GET /api/users
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener todos los usuarios',
        description: 'Retorna la lista de usuarios con sus relaciones (rol, doctor, patient).'
    })
    @ApiQuery({
        name: 'includeInactive',
        required: false,
        type: Boolean,
        description: 'Incluir usuarios inactivos',
        example: false
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de usuarios obtenida exitosamente',
        type: [UserResponseDto]
    })
    async findAll(
        @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean
    ): Promise<UserResponseDto[]> {
        return await this.usersService.findAll(includeInactive || false);
    }

    /**
     * Obtener un usuario por ID
     * GET /api/users/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener usuario por ID',
        description: 'Retorna los detalles completos de un usuario específico.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del usuario',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Usuario encontrado',
        type: UserResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'ID inválido' 
    })
    async findById(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<UserResponseDto> {
        return await this.usersService.findById(id);
    }

    /**
     * Obtener usuario por email
     * GET /api/users/email/:email
     */
    @Get('email/:email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener usuario por email',
        description: 'Busca un usuario por su dirección de email.'
    })
    @ApiParam({
        name: 'email',
        description: 'Email del usuario',
        example: 'usuario@ejemplo.com'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Usuario encontrado',
        type: UserResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado' 
    })
    async findByEmail(
        @Param('email') email: string
    ): Promise<UserResponseDto> {
        return await this.usersService.findByEmail(email);
    }

    /**
     * Buscar usuarios
     * GET /api/users/search?q=termino
     */
    @Get('search/query')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Buscar usuarios',
        description: 'Busca usuarios por nombre, apellido o email.'
    })
    @ApiQuery({
        name: 'q',
        description: 'Término de búsqueda',
        example: 'Juan',
        required: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultados de búsqueda',
        type: [UserResponseDto]
    })
    async search(
        @Query('q') searchTerm: string
    ): Promise<UserResponseDto[]> {
        return await this.usersService.search(searchTerm);
    }

    /**
     * Obtener usuarios por rol
     * GET /api/users/role/:roleId
     */
    @Get('role/:roleId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener usuarios por rol',
        description: 'Retorna todos los usuarios con un rol específico.'
    })
    @ApiParam({
        name: 'roleId',
        description: 'UUID del rol',
        example: 'uuid-role-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de usuarios con ese rol',
        type: [UserResponseDto]
    })
    async findByRole(
        @Param('roleId', new ParseUUIDPipe()) roleId: string
    ): Promise<UserResponseDto[]> {
        return await this.usersService.findByRole(roleId);
    }

    /**
     * Actualizar usuario
     * PATCH /api/users/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar usuario',
        description: 'Actualiza los datos de un usuario. No incluye cambio de contraseña ni rol.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del usuario a actualizar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Usuario actualizado exitosamente',
        type: UserResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado' 
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El nuevo email ya está en uso' 
    })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateUserDto: UpdateUserDto
    ): Promise<UserResponseDto> {
        return await this.usersService.update(id, updateUserDto);
    }

    /**
     * Cambiar contraseña
     * PATCH /api/users/:id/change-password
     */
    @Patch(':id/change-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Cambiar contraseña',
        description: 'Permite al usuario cambiar su contraseña. Requiere contraseña actual.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del usuario',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Contraseña cambiada exitosamente',
        schema: {
        type: 'object',
        properties: {
            message: { type: 'string', example: 'Contraseña actualizada exitosamente' }
        }
        }
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Contraseña actual incorrecta' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Las contraseñas no coinciden' 
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado' 
    })
    async changePassword(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() changePasswordDto: ChangePasswordDto
    ): Promise<{ message: string }> {
        await this.usersService.changePassword(id, changePasswordDto);
        return { message: 'Contraseña actualizada exitosamente' };
    }

    /**
     * Desactivar usuario
     * PATCH /api/users/:id/deactivate
     */
    @Patch(':id/deactivate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Desactivar usuario',
        description: 'Desactiva un usuario (soft delete). El usuario no podrá iniciar sesión.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del usuario a desactivar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Usuario desactivado exitosamente',
        type: UserResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async deactivate(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<UserResponseDto> {
        return await this.usersService.deactivate(id);
    }

    /**
     * Activar usuario
     * PATCH /api/users/:id/activate
     */
    @Patch(':id/activate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Activar usuario',
        description: 'Reactiva un usuario previamente desactivado.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del usuario a activar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Usuario activado exitosamente',
        type: UserResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async activate(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<UserResponseDto> {
        return await this.usersService.activate(id);
    }

    /**
     * Verificar email
     * PATCH /api/users/:id/verify-email
     */
    @Patch(':id/verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Verificar email',
        description: 'Marca el email del usuario como verificado.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del usuario',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Email verificado exitosamente',
        type: UserResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado' 
    })
    async verifyEmail(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<UserResponseDto> {
        return await this.usersService.verifyEmail(id);
    }

    /**
     * Eliminar usuario permanentemente
     * DELETE /api/users/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Eliminar usuario',
        description: 'Elimina un usuario permanentemente del sistema. Acción irreversible.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del usuario a eliminar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Usuario eliminado exitosamente',
        schema: {
        type: 'object',
        properties: {
            message: { type: 'string', example: 'Usuario eliminado exitosamente' }
        }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Usuario no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'No se puede eliminar el usuario por relaciones activas' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async delete(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<{ message: string }> {
        await this.usersService.delete(id);
        return { message: 'Usuario eliminado exitosamente' };
    }

    /**
     * Verificar si un email existe
     * GET /api/users/check-email/:email
     */
    @Get('check-email/:email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Verificar existencia de email',
        description: 'Verifica si un email ya está registrado en el sistema.'
    })
    @ApiParam({
        name: 'email',
        description: 'Email a verificar',
        example: 'usuario@ejemplo.com'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultado de la verificación',
        schema: {
        type: 'object',
        properties: {
            email: { type: 'string', example: 'usuario@ejemplo.com' },
            exists: { type: 'boolean', example: true }
        }
        }
    })
    async checkEmail(
        @Param('email') email: string
    ): Promise<{ email: string; exists: boolean }> {
        const exists = await this.usersService.emailExists(email);
        return { email, exists };
    }

    /**
     * Contar usuarios
     * GET /api/users/stats/count
     */
    @Get('stats/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar usuarios',
        description: 'Retorna el total de usuarios en el sistema.'
    })
    @ApiQuery({
        name: 'onlyActive',
        required: false,
        type: Boolean,
        description: 'Contar solo usuarios activos',
        example: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
        type: 'object',
        properties: {
            total: { type: 'number', example: 150 },
            onlyActive: { type: 'boolean', example: true }
        }
        }
    })
    async count(
        @Query('onlyActive', new ParseBoolPipe({ optional: true })) onlyActive?: boolean
    ): Promise<{ total: number; onlyActive: boolean }> {
        const total = await this.usersService.count(onlyActive || false);
        return { total, onlyActive: onlyActive || false };
    }

    /**
     * Contar usuarios por rol
     * GET /api/users/stats/count-by-role/:roleId
     */
    @Get('stats/count-by-role/:roleId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar usuarios por rol',
        description: 'Retorna la cantidad de usuarios activos con un rol específico.'
    })
    @ApiParam({
        name: 'roleId',
        description: 'UUID del rol',
        example: 'uuid-role-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
        type: 'object',
        properties: {
            roleId: { type: 'string', example: 'uuid-role-123' },
            count: { type: 'number', example: 45 }
        }
        }
    })
    async countByRole(
        @Param('roleId', new ParseUUIDPipe()) roleId: string
    ): Promise<{ roleId: string; count: number }> {
        const count = await this.usersService.countByRole(roleId);
        return { roleId, count };
    }
}