import { 
    Controller, 
    Get, 
    Post, 
    Patch, 
    Delete,
    Body, 
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseUUIDPipe
} from '@nestjs/common';
    import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse,
    ApiBearerAuth,
    ApiParam
} from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dtos/roles/create-role.dto';
import { UpdateRoleDto } from '../dtos/roles/update-role.dto';
import { RoleResponseDto } from '../dtos/roles/role-response.dto';

@ApiTags('roles')
@Controller('roles')
// @ApiBearerAuth() // Descomentar cuando implementes JWT
// @UseGuards(JwtAuthGuard, RolesGuard) // Descomentar cuando implementes guards
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    /**
     * Crear un nuevo rol
     * POST /api/roles
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Crear nuevo rol',
        description: 'Crea un nuevo rol en el sistema. Solo accesible por administradores.'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Rol creado exitosamente',
        type: RoleResponseDto
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El rol ya existe' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Datos de entrada inválidos' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes decorador de roles
    async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
        return await this.rolesService.create(createRoleDto);
    }

    /**
     * Obtener todos los roles
     * GET /api/roles
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener todos los roles',
        description: 'Retorna la lista completa de roles del sistema ordenados alfabéticamente.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de roles obtenida exitosamente',
        type: [RoleResponseDto]
    })
    async findAll(): Promise<RoleResponseDto[]> {
        return await this.rolesService.findAll();
    }

    /**
     * Obtener un rol por ID
     * GET /api/roles/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener rol por ID',
        description: 'Retorna los detalles de un rol específico incluyendo usuarios asignados.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del rol',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Rol encontrado',
        type: RoleResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Rol no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'ID inválido' 
    })
    async findById(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<RoleResponseDto> {
        return await this.rolesService.findById(id);
    }

    /**
     * Obtener rol por nombre
     * GET /api/roles/name/:name
     */
    @Get('name/:name')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener rol por nombre',
        description: 'Busca un rol por su nombre (ADMIN, DOCTOR, PATIENT, etc.)'
    })
    @ApiParam({
        name: 'name',
        description: 'Nombre del rol',
        example: 'ADMIN'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Rol encontrado',
        type: RoleResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Rol no encontrado' 
    })
    async findByName(
        @Param('name') name: string
    ): Promise<RoleResponseDto> {
        return await this.rolesService.findByName(name);
    }

    /**
     * Actualizar un rol
     * PATCH /api/roles/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar rol',
        description: 'Actualiza los datos de un rol existente. Los roles del sistema (ADMIN, DOCTOR, PATIENT) no pueden ser modificados.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del rol a actualizar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Rol actualizado exitosamente',
        type: RoleResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Rol no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'No se puede modificar un rol del sistema' 
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El nuevo nombre del rol ya existe' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes decorador de roles
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateRoleDto: UpdateRoleDto
    ): Promise<RoleResponseDto> {
        return await this.rolesService.update(id, updateRoleDto);
    }

    /**
     * Eliminar un rol
     * DELETE /api/roles/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Eliminar rol',
        description: 'Elimina un rol del sistema. No se pueden eliminar roles del sistema ni roles con usuarios asignados.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del rol a eliminar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Rol eliminado exitosamente',
        schema: {
        type: 'object',
        properties: {
            message: { type: 'string', example: 'Rol eliminado exitosamente' }
        }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Rol no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'No se puede eliminar un rol del sistema o con usuarios asignados' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes decorador de roles
    async delete(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<{ message: string }> {
        await this.rolesService.delete(id);
        return { message: 'Rol eliminado exitosamente' };
    }

    /**
     * Contar usuarios por rol
     * GET /api/roles/:id/users/count
     */
    @Get(':id/users/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar usuarios por rol',
        description: 'Retorna la cantidad de usuarios asignados a un rol específico.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del rol',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Cantidad de usuarios obtenida',
        schema: {
        type: 'object',
        properties: {
            roleId: { type: 'string', example: 'uuid-123-456' },
            roleName: { type: 'string', example: 'DOCTOR' },
            usersCount: { type: 'number', example: 15 }
        }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Rol no encontrado' 
    })
    async countUsers(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<{ roleId: string; roleName: string; usersCount: number }> {
        const role = await this.rolesService.findById(id);
        const count = await this.rolesService.countUsersByRole(id);
        
        return {
        roleId: role.id,
        roleName: role.name,
        usersCount: count
        };
    }

    /**
     * Verificar si existe un rol por nombre
     * GET /api/roles/exists/:name
     */
    @Get('exists/:name')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Verificar existencia de rol',
        description: 'Verifica si existe un rol con el nombre especificado.'
    })
    @ApiParam({
        name: 'name',
        description: 'Nombre del rol a verificar',
        example: 'DOCTOR'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultado de la verificación',
        schema: {
        type: 'object',
        properties: {
            name: { type: 'string', example: 'DOCTOR' },
            exists: { type: 'boolean', example: true }
        }
        }
    })
    async exists(
        @Param('name') name: string
    ): Promise<{ name: string; exists: boolean }> {
        const exists = await this.rolesService.existsByName(name);
        
        return {
        name: name.toUpperCase(),
        exists
        };
    }
}