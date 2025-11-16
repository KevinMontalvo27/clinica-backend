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
    ParseIntPipe
} from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger';
import { ConsultationsService } from '../services/consultation.service';
import { CreateConsultationDto } from '../dtos/create-consultation.dto';
import { UpdateConsultationDto } from '../dtos/update-consultation.dto';
import { ConsultationQueryDto } from '../dtos/consultation-query.dto';
import { Consultation } from '../entities/consultation.entity';

@ApiTags('consultations')
@Controller('consultations')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class ConsultationsController {
    constructor(private readonly consultationsService: ConsultationsService) {}

    /**
     * Crear una nueva consulta
     * POST /api/consultations
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Crear nueva consulta médica',
        description: 'Registra una nueva consulta médica con signos vitales, diagnóstico y tratamiento.'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Consulta creada exitosamente'
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Datos inválidos o presión arterial incoherente' 
    })
    async create(@Body() createConsultationDto: CreateConsultationDto): Promise<Consultation> {
        return await this.consultationsService.create(createConsultationDto);
    }

    /**
     * Obtener todas las consultas con filtros
     * GET /api/consultations
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener todas las consultas',
        description: 'Lista todas las consultas con filtros opcionales por paciente, doctor, fechas y diagnóstico.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de consultas obtenida exitosamente'
    })
    async findAll(
        @Query() query: ConsultationQueryDto
    ): Promise<{ data: Consultation[]; total: number; page: number; limit: number; totalPages: number }> {
        const [consultations, total] = await this.consultationsService.findAll(query);
        const page = query.page || 1;
        const limit = query.limit || 10;
        
        return {
            data: consultations,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Obtener consulta por ID
     * GET /api/consultations/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener consulta por ID',
        description: 'Retorna los detalles completos de una consulta incluyendo paciente, doctor y cita asociada.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID de la consulta',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Consulta encontrada'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Consulta no encontrada' 
    })
    async findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<Consultation> {
        return await this.consultationsService.findById(id);
    }

    /**
     * Obtener consultas de un paciente
     * GET /api/consultations/patient/:patientId
     */
    @Get('patient/:patientId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener consultas de un paciente',
        description: 'Lista todas las consultas de un paciente específico con filtro opcional de fechas.'
    })
    @ApiParam({
        name: 'patientId',
        description: 'UUID del paciente',
        example: 'uuid-patient-123'
    })
    @ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Fecha de inicio',
        example: '2025-01-01'
    })
    @ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Fecha de fin',
        example: '2025-12-31'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de consultas del paciente'
    })
    async findByPatient(
        @Param('patientId', new ParseUUIDPipe()) patientId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ): Promise<Consultation[]> {
        return await this.consultationsService.findByPatient(patientId, startDate, endDate);
    }

    /**
     * Obtener consultas de un doctor
     * GET /api/consultations/doctor/:doctorId
     */
    @Get('doctor/:doctorId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener consultas de un doctor',
        description: 'Lista todas las consultas realizadas por un doctor específico con filtro opcional de fechas.'
    })
    @ApiParam({
        name: 'doctorId',
        description: 'UUID del doctor',
        example: 'uuid-doctor-456'
    })
    @ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Fecha de inicio',
        example: '2025-01-01'
    })
    @ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Fecha de fin',
        example: '2025-12-31'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de consultas del doctor'
    })
    async findByDoctor(
        @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ): Promise<Consultation[]> {
        return await this.consultationsService.findByDoctor(doctorId, startDate, endDate);
    }

    /**
     * Obtener última consulta de un paciente
     * GET /api/consultations/patient/:patientId/last
     */
    @Get('patient/:patientId/last')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener última consulta del paciente',
        description: 'Retorna la consulta más reciente de un paciente.'
    })
    @ApiParam({
        name: 'patientId',
        description: 'UUID del paciente',
        example: 'uuid-patient-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Última consulta encontrada'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'No se encontraron consultas para este paciente' 
    })
    async findLastByPatient(
        @Param('patientId', new ParseUUIDPipe()) patientId: string
    ): Promise<Consultation | null> {
        return await this.consultationsService.findLastByPatient(patientId);
    }

    /**
     * Obtener consultas recientes
     * GET /api/consultations/recent/list
     */
    @Get('recent/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener consultas recientes',
        description: 'Lista las consultas de los últimos 30 días.'
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
        description: 'Lista de consultas recientes'
    })
    async findRecent(
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
    ): Promise<Consultation[]> {
        return await this.consultationsService.findRecent(limit || 10);
    }

    /**
     * Obtener consultas de hoy
     * GET /api/consultations/today/list
     */
    @Get('today/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener consultas de hoy',
        description: 'Lista todas las consultas registradas hoy.'
    })
    @ApiQuery({
        name: 'doctorId',
        required: false,
        type: String,
        description: 'Filtrar por doctor',
        example: 'uuid-doctor-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de consultas de hoy'
    })
    async findToday(@Query('doctorId') doctorId?: string): Promise<Consultation[]> {
        return await this.consultationsService.findToday(doctorId);
    }

    /**
     * Buscar consultas por diagnóstico
     * GET /api/consultations/search/diagnosis
     */
    @Get('search/diagnosis')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Buscar consultas por diagnóstico',
        description: 'Busca consultas que contengan un término específico en el diagnóstico.'
    })
    @ApiQuery({
        name: 'q',
        required: true,
        type: String,
        description: 'Término de búsqueda',
        example: 'diabetes'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultados de búsqueda'
    })
    async searchByDiagnosis(@Query('q') searchTerm: string): Promise<Consultation[]> {
        return await this.consultationsService.searchByDiagnosis(searchTerm);
    }

    /**
     * Actualizar consulta
     * PATCH /api/consultations/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar consulta',
        description: 'Actualiza los datos de una consulta médica existente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID de la consulta a actualizar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Consulta actualizada exitosamente'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Consulta no encontrada' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Datos inválidos' 
    })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateConsultationDto: UpdateConsultationDto
    ): Promise<Consultation> {
        return await this.consultationsService.update(id, updateConsultationDto);
    }

    /**
     * Eliminar consulta
     * DELETE /api/consultations/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Eliminar consulta',
        description: 'Elimina permanentemente una consulta del sistema.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID de la consulta a eliminar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Consulta eliminada exitosamente'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Consulta no encontrada' 
    })
    async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ message: string }> {
        await this.consultationsService.delete(id);
        return { message: 'Consulta eliminada exitosamente' };
    }

    /**
     * Contar consultas por paciente
     * GET /api/consultations/patient/:patientId/count
     */
    @Get('patient/:patientId/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar consultas de un paciente',
        description: 'Retorna el total de consultas de un paciente.'
    })
    @ApiParam({
        name: 'patientId',
        description: 'UUID del paciente',
        example: 'uuid-patient-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
            type: 'object',
            properties: {
                patientId: { type: 'string', example: 'uuid-patient-123' },
                count: { type: 'number', example: 15 }
            }
        }
    })
    async countByPatient(
        @Param('patientId', new ParseUUIDPipe()) patientId: string
    ): Promise<{ patientId: string; count: number }> {
        const count = await this.consultationsService.countByPatient(patientId);
        return { patientId, count };
    }

    /**
     * Contar consultas por doctor
     * GET /api/consultations/doctor/:doctorId/count
     */
    @Get('doctor/:doctorId/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar consultas de un doctor',
        description: 'Retorna el total de consultas realizadas por un doctor.'
    })
    @ApiParam({
        name: 'doctorId',
        description: 'UUID del doctor',
        example: 'uuid-doctor-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
            type: 'object',
            properties: {
                doctorId: { type: 'string', example: 'uuid-doctor-456' },
                count: { type: 'number', example: 142 }
            }
        }
    })
    async countByDoctor(
        @Param('doctorId', new ParseUUIDPipe()) doctorId: string
    ): Promise<{ doctorId: string; count: number }> {
        const count = await this.consultationsService.countByDoctor(doctorId);
        return { doctorId, count };
    }

    /**
     * Obtener estadísticas de signos vitales
     * GET /api/consultations/patient/:patientId/vital-signs-stats
     */
    @Get('patient/:patientId/vital-signs-stats')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener estadísticas de signos vitales',
        description: 'Retorna promedios de signos vitales de las últimas 10 consultas del paciente.'
    })
    @ApiParam({
        name: 'patientId',
        description: 'UUID del paciente',
        example: 'uuid-patient-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Estadísticas obtenidas',
        schema: {
            type: 'object',
            properties: {
                patientId: { type: 'string' },
                consultationsAnalyzed: { type: 'number' },
                averageWeight: { type: 'number' },
                averageBloodPressure: { 
                    type: 'object',
                    properties: {
                        systolic: { type: 'number' },
                        diastolic: { type: 'number' }
                    }
                },
                averageHeartRate: { type: 'number' },
                latestConsultation: { type: 'string', format: 'date-time' }
            }
        }
    })
    async getVitalSignsStats(
        @Param('patientId', new ParseUUIDPipe()) patientId: string
    ): Promise<any> {
        return await this.consultationsService.getVitalSignsStats(patientId);
    }

    /**
     * Obtener estadísticas generales
     * GET /api/consultations/stats/general
     */
    @Get('stats/general')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener estadísticas generales',
        description: 'Retorna estadísticas generales de todas las consultas del sistema.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Estadísticas obtenidas',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number' },
                lastMonth: { type: 'number' },
                withDiagnosis: { type: 'number' },
                withPrescriptions: { type: 'number' },
                averagePerDay: { type: 'number' }
            }
        }
    })
    async getGeneralStatistics(): Promise<any> {
        return await this.consultationsService.getGeneralStatistics();
    }

    /**
     * Obtener diagnósticos más comunes
     * GET /api/consultations/stats/common-diagnoses
     */
    @Get('stats/common-diagnoses')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener diagnósticos más comunes',
        description: 'Retorna los diagnósticos más frecuentes en el sistema.'
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
        description: 'Lista de diagnósticos más comunes',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    diagnosis: { type: 'string' },
                    count: { type: 'number' }
                }
            }
        }
    })
    async getCommonDiagnoses(
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
    ): Promise<any[]> {
        return await this.consultationsService.getCommonDiagnoses(limit || 10);
    }
}