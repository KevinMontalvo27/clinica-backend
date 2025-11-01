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
    ParseIntPipe,
    ParseFloatPipe
} from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger';
import { SpecialtiesService } from '../services/specialties.service';
import { CreateSpecialtyDto } from '../dtos/specialties/create-specialty.dto';
import { UpdateSpecialtyDto } from '../dtos/specialties/update-specialty.dto';
import { SpecialtyResponseDto } from '../dtos/specialties/specialty-response.dto';

@ApiTags('specialties')
@Controller('specialties')
// @ApiBearerAuth() // Descomentar cuando implementes JWT
// @UseGuards(JwtAuthGuard) // Descomentar cuando implementes guards
export class SpecialtiesController {
    constructor(private readonly specialtiesService: SpecialtiesService) {}

    /**
     * Crear una nueva especialidad
     * POST /api/specialties
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Crear nueva especialidad',
        description: 'Crea una nueva especialidad médica en el sistema. Solo accesible por administradores.'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Especialidad creada exitosamente',
        type: SpecialtyResponseDto
    })
    @ApiResponse({ 
        status: 409, 
        description: 'La especialidad ya existe' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Datos de entrada inválidos' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes decorador de roles
    async create(@Body() createSpecialtyDto: CreateSpecialtyDto): Promise<SpecialtyResponseDto> {
        return await this.specialtiesService.create(createSpecialtyDto);
    }

    /**
     * Obtener todas las especialidades
     * GET /api/specialties
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener todas las especialidades',
        description: 'Retorna la lista completa de especialidades ordenadas alfabéticamente.'
    })
    @ApiQuery({
        name: 'includeInactive',
        required: false,
        type: Boolean,
        description: 'Incluir especialidades sin doctores',
        example: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de especialidades obtenida exitosamente',
        type: [SpecialtyResponseDto]
    })
    async findAll(
        @Query('includeInactive') includeInactive?: boolean
    ): Promise<SpecialtyResponseDto[]> {
        return await this.specialtiesService.findAll(includeInactive !== false);
    }

    /**
     * Obtener especialidad por ID
     * GET /api/specialties/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener especialidad por ID',
        description: 'Retorna los detalles de una especialidad específica incluyendo doctores asignados.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID de la especialidad',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Especialidad encontrada',
        type: SpecialtyResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Especialidad no encontrada' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'ID inválido' 
    })
    async findById(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<SpecialtyResponseDto> {
        return await this.specialtiesService.findById(id);
    }

    /**
     * Obtener especialidad por nombre
     * GET /api/specialties/name/:name
     */
    @Get('name/:name')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener especialidad por nombre',
        description: 'Busca una especialidad por su nombre exacto.'
    })
    @ApiParam({
        name: 'name',
        description: 'Nombre de la especialidad',
        example: 'Cardiología'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Especialidad encontrada',
        type: SpecialtyResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Especialidad no encontrada' 
    })
    async findByName(
        @Param('name') name: string
    ): Promise<SpecialtyResponseDto> {
        return await this.specialtiesService.findByName(name);
    }

    /**
     * Buscar especialidades
     * GET /api/specialties/search/query
     */
    @Get('search/query')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Buscar especialidades',
        description: 'Busca especialidades por nombre o descripción (búsqueda parcial).'
    })
    @ApiQuery({
        name: 'q',
        description: 'Término de búsqueda',
        example: 'cardio',
        required: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultados de búsqueda',
        type: [SpecialtyResponseDto]
    })
    async search(
        @Query('q') searchTerm: string
    ): Promise<SpecialtyResponseDto[]> {
        return await this.specialtiesService.search(searchTerm);
    }

    /**
     * Obtener especialidades con doctores disponibles
     * GET /api/specialties/available/list
     */
    @Get('available/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener especialidades con doctores disponibles',
        description: 'Retorna solo las especialidades que tienen al menos un doctor disponible.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de especialidades disponibles',
        type: [SpecialtyResponseDto]
    })
    async findWithAvailableDoctors(): Promise<SpecialtyResponseDto[]> {
        return await this.specialtiesService.findWithAvailableDoctors();
    }

    /**
     * Obtener especialidades ordenadas
     * GET /api/specialties/sorted/list
     */
    @Get('sorted/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener especialidades ordenadas',
        description: 'Retorna especialidades ordenadas por el campo especificado.'
    })
    @ApiQuery({
        name: 'orderBy',
        required: false,
        enum: ['name', 'basePrice', 'consultationDuration'],
        description: 'Campo por el cual ordenar',
        example: 'name'
    })
    @ApiQuery({
        name: 'order',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Orden ascendente o descendente',
        example: 'ASC'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de especialidades ordenadas',
        type: [SpecialtyResponseDto]
    })
    async findAllSorted(
        @Query('orderBy') orderBy: 'name' | 'basePrice' | 'consultationDuration' = 'name',
        @Query('order') order: 'ASC' | 'DESC' = 'ASC'
    ): Promise<SpecialtyResponseDto[]> {
        return await this.specialtiesService.findAllSorted(orderBy, order);
    }

    /**
     * Obtener especialidades por rango de precios
     * GET /api/specialties/price-range
     */
    @Get('price-range/filter')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Filtrar por rango de precios',
        description: 'Retorna especialidades dentro de un rango de precios específico.'
    })
    @ApiQuery({
        name: 'minPrice',
        required: true,
        type: Number,
        description: 'Precio mínimo',
        example: 300
    })
    @ApiQuery({
        name: 'maxPrice',
        required: true,
        type: Number,
        description: 'Precio máximo',
        example: 1000
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Especialidades en el rango de precios',
        type: [SpecialtyResponseDto]
    })
    async findByPriceRange(
        @Query('minPrice', ParseFloatPipe) minPrice: number,
        @Query('maxPrice', ParseFloatPipe) maxPrice: number
    ): Promise<SpecialtyResponseDto[]> {
        return await this.specialtiesService.findByPriceRange(minPrice, maxPrice);
    }

    /**
     * Obtener especialidades más populares
     * GET /api/specialties/popular/list
     */
    @Get('popular/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener especialidades más populares',
        description: 'Retorna las especialidades con más doctores disponibles.'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Cantidad de resultados',
        example: 5
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de especialidades populares',
        type: [SpecialtyResponseDto]
    })
    async findMostPopular(
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
    ): Promise<SpecialtyResponseDto[]> {
        return await this.specialtiesService.findMostPopular(limit || 5);
    }

    /**
     * Obtener especialidad con más doctores
     * GET /api/specialties/top/doctors
     */
    @Get('top/doctors')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener especialidad con más doctores',
        description: 'Retorna la especialidad que tiene más doctores disponibles.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Especialidad con más doctores',
        type: SpecialtyResponseDto
    })
    async findMostDoctorsAvailable(): Promise<SpecialtyResponseDto | null> {
        return await this.specialtiesService.findMostDoctorsAvailable();
    }

    /**
     * Actualizar especialidad
     * PATCH /api/specialties/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar especialidad',
        description: 'Actualiza los datos de una especialidad existente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID de la especialidad a actualizar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Especialidad actualizada exitosamente',
        type: SpecialtyResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Especialidad no encontrada' 
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El nuevo nombre ya existe' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes decorador de roles
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateSpecialtyDto: UpdateSpecialtyDto
    ): Promise<SpecialtyResponseDto> {
        return await this.specialtiesService.update(id, updateSpecialtyDto);
    }

    /**
     * Eliminar especialidad
     * DELETE /api/specialties/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Eliminar especialidad',
        description: 'Elimina una especialidad del sistema. No se puede eliminar si tiene doctores asignados.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID de la especialidad a eliminar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Especialidad eliminada exitosamente',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Especialidad eliminada exitosamente' }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Especialidad no encontrada' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'No se puede eliminar porque tiene doctores asignados' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes decorador de roles
    async delete(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<{ message: string }> {
        await this.specialtiesService.delete(id);
        return { message: 'Especialidad eliminada exitosamente' };
    }

    /**
     * Verificar si existe una especialidad por nombre
     * GET /api/specialties/exists/:name
     */
    @Get('exists/:name')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Verificar existencia de especialidad',
        description: 'Verifica si existe una especialidad con el nombre especificado.'
    })
    @ApiParam({
        name: 'name',
        description: 'Nombre de la especialidad a verificar',
        example: 'Cardiología'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultado de la verificación',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'Cardiología' },
                exists: { type: 'boolean', example: true }
            }
        }
    })
    async exists(
        @Param('name') name: string
    ): Promise<{ name: string; exists: boolean }> {
        const exists = await this.specialtiesService.existsByName(name);
        return { name, exists };
    }

    /**
     * Contar especialidades
     * GET /api/specialties/stats/count
     */
    @Get('stats/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar especialidades',
        description: 'Retorna el total de especialidades en el sistema.'
    })
    @ApiQuery({
        name: 'onlyWithDoctors',
        required: false,
        type: Boolean,
        description: 'Contar solo especialidades con doctores',
        example: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number', example: 25 },
                onlyWithDoctors: { type: 'boolean', example: true }
            }
        }
    })
    async count(
        @Query('onlyWithDoctors') onlyWithDoctors?: boolean
    ): Promise<{ total: number; onlyWithDoctors: boolean }> {
        const total = await this.specialtiesService.count(onlyWithDoctors || false);
        return { 
            total, 
            onlyWithDoctors: onlyWithDoctors || false 
        };
    }

    /**
     * Contar doctores por especialidad
     * GET /api/specialties/:id/doctors/count
     */
    @Get(':id/doctors/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar doctores por especialidad',
        description: 'Retorna la cantidad de doctores en una especialidad específica.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID de la especialidad',
        example: 'uuid-123-456'
    })
    @ApiQuery({
        name: 'onlyAvailable',
        required: false,
        type: Boolean,
        description: 'Contar solo doctores disponibles',
        example: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
            type: 'object',
            properties: {
                specialtyId: { type: 'string', example: 'uuid-123-456' },
                count: { type: 'number', example: 12 },
                onlyAvailable: { type: 'boolean', example: true }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Especialidad no encontrada' 
    })
    async countDoctors(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query('onlyAvailable') onlyAvailable?: boolean
    ): Promise<{ specialtyId: string; count: number; onlyAvailable: boolean }> {
        const count = await this.specialtiesService.countDoctorsBySpecialty(
            id, 
            onlyAvailable !== false
        );
        return { 
            specialtyId: id, 
            count,
            onlyAvailable: onlyAvailable !== false
        };
    }

    /**
     * Obtener estadísticas de una especialidad
     * GET /api/specialties/:id/statistics
     */
    @Get(':id/statistics')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener estadísticas de especialidad',
        description: 'Retorna estadísticas detalladas de una especialidad (doctores, precios, citas, etc.).'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID de la especialidad',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Estadísticas obtenidas',
        schema: {
            type: 'object',
            properties: {
                specialtyId: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                basePrice: { type: 'number' },
                consultationDuration: { type: 'number' },
                totalDoctors: { type: 'number' },
                availableDoctors: { type: 'number' },
                unavailableDoctors: { type: 'number' },
                averageConsultationPrice: { type: 'number' },
                totalAppointments: { type: 'number' },
                completedAppointments: { type: 'number' }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Especialidad no encontrada' 
    })
    async getStatistics(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<any> {
        return await this.specialtiesService.getStatistics(id);
    }
}