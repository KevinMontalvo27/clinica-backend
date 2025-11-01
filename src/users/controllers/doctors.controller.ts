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
    ParseUUIDPipe
} from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger';
import { DoctorsService } from '../services/doctors.service';
import { CreateDoctorDto } from '../dtos/doctors/create-doctor.dto';
import { UpdateDoctorDto } from '../dtos/doctors/update-doctor.dto';
import { UpdateDoctorAvailabilityDto } from '../dtos/doctors/update-doctor-availability.dto';
import { DoctorResponseDto } from '../dtos/doctors/doctor-response.dto';
import { DoctorQueryDto } from '../dtos/doctors/doctor-query.dto';

@ApiTags('doctors')
@Controller('doctors')
// @ApiBearerAuth() // Descomentar cuando implementes JWT
// @UseGuards(JwtAuthGuard) // Descomentar cuando implementes guards
export class DoctorsController {
    constructor(private readonly doctorsService: DoctorsService) {}

    /**
     * Crear un nuevo doctor
     * POST /api/doctors
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Crear nuevo doctor',
        description: 'Crea un nuevo doctor con su usuario asociado. El rol DOCTOR se asigna automáticamente.'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Doctor creado exitosamente',
        type: DoctorResponseDto
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El email o la cédula profesional ya están registrados' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Datos de entrada inválidos' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes decorador de roles
    async create(@Body() createDoctorDto: CreateDoctorDto): Promise<DoctorResponseDto> {
        return await this.doctorsService.create(createDoctorDto);
    }

    /**
     * Obtener todos los doctores con filtros
     * GET /api/doctors
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener todos los doctores',
        description: 'Retorna la lista de doctores con filtros opcionales, paginación y ordenamiento.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de doctores obtenida exitosamente',
        schema: {
            type: 'object',
            properties: {
                data: { 
                    type: 'array', 
                    items: { $ref: '#/components/schemas/DoctorResponseDto' } 
                },
                total: { type: 'number', example: 50 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 5 }
            }
        }
    })
    async findAll(
        @Query() query: DoctorQueryDto
    ): Promise<{ data: DoctorResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
        const [doctors, total] = await this.doctorsService.findAll(query);
        const page = query.page || 1;
        const limit = query.limit || 10;
        
        return {
            data: doctors,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Obtener un doctor por ID
     * GET /api/doctors/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener doctor por ID',
        description: 'Retorna los detalles completos de un doctor incluyendo usuario, especialidad, horarios y citas.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del doctor',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Doctor encontrado',
        type: DoctorResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Doctor no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'ID inválido' 
    })
    async findById(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<DoctorResponseDto> {
        return await this.doctorsService.findById(id);
    }

    /**
     * Obtener doctor por ID de usuario
     * GET /api/doctors/user/:userId
     */
    @Get('user/:userId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener doctor por ID de usuario',
        description: 'Busca un doctor por el ID de su usuario asociado.'
    })
    @ApiParam({
        name: 'userId',
        description: 'UUID del usuario',
        example: 'uuid-user-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Doctor encontrado',
        type: DoctorResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Doctor no encontrado' 
    })
    async findByUserId(
        @Param('userId', new ParseUUIDPipe()) userId: string
    ): Promise<DoctorResponseDto> {
        return await this.doctorsService.findByUserId(userId);
    }

    /**
     * Obtener doctores disponibles
     * GET /api/doctors/available/list
     */
    @Get('available/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener doctores disponibles',
        description: 'Retorna todos los doctores disponibles para agendar citas (isAvailable = true y usuario activo).'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de doctores disponibles',
        type: [DoctorResponseDto]
    })
    async findAvailable(): Promise<DoctorResponseDto[]> {
        return await this.doctorsService.findAvailable();
    }

    /**
     * Obtener doctores por especialidad
     * GET /api/doctors/specialty/:specialtyId
     */
    @Get('specialty/:specialtyId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener doctores por especialidad',
        description: 'Retorna todos los doctores de una especialidad específica.'
    })
    @ApiParam({
        name: 'specialtyId',
        description: 'UUID de la especialidad',
        example: 'uuid-specialty-123'
    })
    @ApiQuery({
        name: 'onlyAvailable',
        required: false,
        type: Boolean,
        description: 'Filtrar solo doctores disponibles',
        example: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de doctores de la especialidad',
        type: [DoctorResponseDto]
    })
    async findBySpecialty(
        @Param('specialtyId', new ParseUUIDPipe()) specialtyId: string,
        @Query('onlyAvailable') onlyAvailable?: boolean
    ): Promise<DoctorResponseDto[]> {
        const available = onlyAvailable === undefined ? true : onlyAvailable;
        return await this.doctorsService.findBySpecialty(specialtyId, available);
    }

    /**
     * Buscar doctores
     * GET /api/doctors/search/query
     */
    @Get('search/query')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Buscar doctores',
        description: 'Busca doctores por nombre o apellido.'
    })
    @ApiQuery({
        name: 'q',
        description: 'Término de búsqueda',
        example: 'García',
        required: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultados de búsqueda',
        type: [DoctorResponseDto]
    })
    async search(
        @Query('q') searchTerm: string
    ): Promise<DoctorResponseDto[]> {
        return await this.doctorsService.search(searchTerm);
    }

    /**
     * Obtener doctores más populares
     * GET /api/doctors/popular/list
     */
    @Get('popular/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener doctores más populares',
        description: 'Retorna los doctores más populares ordenados por popularidad.'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Cantidad de resultados',
        example: 10
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de doctores populares',
        type: [DoctorResponseDto]
    })
    async findMostPopular(
        @Query('limit') limit?: number
    ): Promise<DoctorResponseDto[]> {
        return await this.doctorsService.findMostPopular(limit || 10);
    }

    /**
     * Actualizar doctor
     * PATCH /api/doctors/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar doctor',
        description: 'Actualiza los datos de un doctor. La cédula profesional no puede ser modificada.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del doctor a actualizar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Doctor actualizado exitosamente',
        type: DoctorResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Doctor no encontrado' 
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El nuevo email ya está en uso' 
    })
    // @Roles('ADMIN', 'DOCTOR') // Descomentar cuando implementes decorador de roles
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateDoctorDto: UpdateDoctorDto
    ): Promise<DoctorResponseDto> {
        return await this.doctorsService.update(id, updateDoctorDto);
    }

    /**
     * Actualizar disponibilidad del doctor
     * PATCH /api/doctors/:id/availability
     */
    @Patch(':id/availability')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar disponibilidad',
        description: 'Actualiza el estado de disponibilidad del doctor para agendar citas.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del doctor',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Disponibilidad actualizada exitosamente',
        type: DoctorResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Doctor no encontrado' 
    })
    // @Roles('ADMIN', 'DOCTOR') // Descomentar cuando implementes decorador de roles
    async updateAvailability(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateAvailabilityDto: UpdateDoctorAvailabilityDto
    ): Promise<DoctorResponseDto> {
        return await this.doctorsService.updateAvailability(id, updateAvailabilityDto);
    }

    /**
     * Desactivar doctor
     * PATCH /api/doctors/:id/deactivate
     */
    @Patch(':id/deactivate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Desactivar doctor',
        description: 'Desactiva un doctor y su usuario asociado. El doctor no podrá iniciar sesión ni recibir citas.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del doctor a desactivar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Doctor desactivado exitosamente',
        type: DoctorResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Doctor no encontrado' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async deactivate(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<DoctorResponseDto> {
        return await this.doctorsService.deactivate(id);
    }

    /**
     * Activar doctor
     * PATCH /api/doctors/:id/activate
     */
    @Patch(':id/activate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Activar doctor',
        description: 'Reactiva un doctor previamente desactivado.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del doctor a activar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Doctor activado exitosamente',
        type: DoctorResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Doctor no encontrado' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async activate(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<DoctorResponseDto> {
        return await this.doctorsService.activate(id);
    }

    /**
     * Eliminar doctor permanentemente
     * DELETE /api/doctors/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Eliminar doctor',
        description: 'Elimina un doctor permanentemente del sistema. Acción irreversible.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del doctor a eliminar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Doctor eliminado exitosamente',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Doctor eliminado exitosamente' }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Doctor no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'No se puede eliminar el doctor por citas activas' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async delete(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<{ message: string }> {
        await this.doctorsService.delete(id);
        return { message: 'Doctor eliminado exitosamente' };
    }

    /**
     * Verificar si existe una cédula profesional
     * GET /api/doctors/license-exists/:licenseNumber
     */
    @Get('license-exists/:licenseNumber')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Verificar existencia de cédula profesional',
        description: 'Verifica si una cédula profesional ya está registrada en el sistema.'
    })
    @ApiParam({
        name: 'licenseNumber',
        description: 'Número de cédula profesional',
        example: '1234567'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultado de la verificación',
        schema: {
            type: 'object',
            properties: {
                licenseNumber: { type: 'string', example: '1234567' },
                exists: { type: 'boolean', example: true }
            }
        }
    })
    async checkLicenseExists(
        @Param('licenseNumber') licenseNumber: string
    ): Promise<{ licenseNumber: string; exists: boolean }> {
        const exists = await this.doctorsService.licenseExists(licenseNumber);
        return { licenseNumber, exists };
    }

    /**
     * Contar doctores
     * GET /api/doctors/stats/count
     */
    @Get('stats/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar doctores',
        description: 'Retorna el total de doctores en el sistema.'
    })
    @ApiQuery({
        name: 'onlyActive',
        required: false,
        type: Boolean,
        description: 'Contar solo doctores con usuarios activos',
        example: true
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
                total: { type: 'number', example: 45 },
                onlyActive: { type: 'boolean', example: true },
                onlyAvailable: { type: 'boolean', example: false }
            }
        }
    })
    async count(
        @Query('onlyActive') onlyActive?: boolean,
        @Query('onlyAvailable') onlyAvailable?: boolean
    ): Promise<{ total: number; onlyActive: boolean; onlyAvailable: boolean }> {
        const total = await this.doctorsService.count(
            onlyActive || false, 
            onlyAvailable || false
        );
        return { 
            total, 
            onlyActive: onlyActive || false,
            onlyAvailable: onlyAvailable || false
        };
    }

    /**
     * Contar doctores por especialidad
     * GET /api/doctors/stats/count-by-specialty/:specialtyId
     */
    @Get('stats/count-by-specialty/:specialtyId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar doctores por especialidad',
        description: 'Retorna la cantidad de doctores activos y disponibles en una especialidad.'
    })
    @ApiParam({
        name: 'specialtyId',
        description: 'UUID de la especialidad',
        example: 'uuid-specialty-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
            type: 'object',
            properties: {
                specialtyId: { type: 'string', example: 'uuid-specialty-123' },
                count: { type: 'number', example: 12 }
            }
        }
    })
    async countBySpecialty(
        @Param('specialtyId', new ParseUUIDPipe()) specialtyId: string
    ): Promise<{ specialtyId: string; count: number }> {
        const count = await this.doctorsService.countBySpecialty(specialtyId);
        return { specialtyId, count };
    }

    /**
     * Obtener estadísticas de un doctor
     * GET /api/doctors/:id/statistics
     */
    @Get(':id/statistics')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener estadísticas del doctor',
        description: 'Retorna estadísticas detalladas de un doctor (citas, pacientes, ingresos, etc.).'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del doctor',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Estadísticas obtenidas',
        schema: {
            type: 'object',
            properties: {
                doctorId: { type: 'string' },
                name: { type: 'string' },
                specialty: { type: 'string' },
                totalAppointments: { type: 'number' },
                completedAppointments: { type: 'number' },
                cancelledAppointments: { type: 'number' },
                totalPatients: { type: 'number' },
                averageRating: { type: 'number' },
                totalEarnings: { type: 'number' }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Doctor no encontrado' 
    })
    async getStatistics(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<any> {
        return await this.doctorsService.getStatistics(id);
    }
}