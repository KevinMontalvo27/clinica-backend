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
import { PatientsService } from '../services/patients.service';
import { CreatePatientDto } from '../dtos/patients/create-patient.dto';
import { UpdatePatientDto } from '../dtos/patients/update-patient.dto';
import { PatientResponseDto } from '../dtos/patients/patient-response.dto';
import { PatientQueryDto } from '../dtos/patients/patient-query.dto';

@ApiTags('patients')
@Controller('patients')
// @ApiBearerAuth() // Descomentar cuando implementes JWT
// @UseGuards(JwtAuthGuard) // Descomentar cuando implementes guards
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) {}

    /**
     * Crear un nuevo paciente
     * POST /api/patients
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Crear nuevo paciente',
        description: 'Crea un nuevo paciente con su usuario asociado. El rol PATIENT se asigna automáticamente.'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Paciente creado exitosamente',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El email ya está registrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Datos de entrada inválidos' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes decorador de roles
    async create(@Body() createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
        return await this.patientsService.create(createPatientDto);
    }

    /**
     * Obtener todos los pacientes con filtros
     * GET /api/patients
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener todos los pacientes',
        description: 'Retorna la lista de pacientes con filtros opcionales, paginación y ordenamiento.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de pacientes obtenida exitosamente',
        schema: {
            type: 'object',
            properties: {
                data: { 
                    type: 'array', 
                    items: { $ref: '#/components/schemas/PatientResponseDto' } 
                },
                total: { type: 'number', example: 150 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 15 }
            }
        }
    })
    async findAll(
        @Query() query: PatientQueryDto
    ): Promise<{ data: PatientResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
        const [patients, total] = await this.patientsService.findAll(query);
        const page = query.page || 1;
        const limit = query.limit || 10;
        
        return {
            data: patients,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Obtener un paciente por ID
     * GET /api/patients/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener paciente por ID',
        description: 'Retorna los detalles completos de un paciente incluyendo usuario, citas y registros médicos.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Paciente encontrado',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'ID inválido' 
    })
    async findById(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<PatientResponseDto> {
        return await this.patientsService.findById(id);
    }

    /**
     * Obtener paciente por ID de usuario
     * GET /api/patients/user/:userId
     */
    @Get('user/:userId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener paciente por ID de usuario',
        description: 'Busca un paciente por el ID de su usuario asociado.'
    })
    @ApiParam({
        name: 'userId',
        description: 'UUID del usuario',
        example: 'uuid-user-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Paciente encontrado',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    async findByUserId(
        @Param('userId', new ParseUUIDPipe()) userId: string
    ): Promise<PatientResponseDto> {
        return await this.patientsService.findByUserId(userId);
    }

    /**
     * Obtener pacientes activos
     * GET /api/patients/active/list
     */
    @Get('active/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener pacientes activos',
        description: 'Retorna todos los pacientes con usuarios activos.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de pacientes activos',
        type: [PatientResponseDto]
    })
    async findActive(): Promise<PatientResponseDto[]> {
        return await this.patientsService.findActive();
    }

    /**
     * Buscar pacientes
     * GET /api/patients/search/query
     */
    @Get('search/query')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Buscar pacientes',
        description: 'Busca pacientes por nombre o email.'
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
        type: [PatientResponseDto]
    })
    async search(
        @Query('q') searchTerm: string
    ): Promise<PatientResponseDto[]> {
        return await this.patientsService.search(searchTerm);
    }

    /**
     * Obtener pacientes por tipo de sangre
     * GET /api/patients/blood-type/:bloodType
     */
    @Get('blood-type/:bloodType')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener pacientes por tipo de sangre',
        description: 'Retorna todos los pacientes con un tipo de sangre específico.'
    })
    @ApiParam({
        name: 'bloodType',
        description: 'Tipo de sangre',
        example: 'O+',
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de pacientes con ese tipo de sangre',
        type: [PatientResponseDto]
    })
    async findByBloodType(
        @Param('bloodType') bloodType: string
    ): Promise<PatientResponseDto[]> {
        return await this.patientsService.findByBloodType(bloodType);
    }

    /**
     * Obtener pacientes con seguro médico
     * GET /api/patients/insurance/list
     */
    @Get('insurance/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener pacientes con seguro médico',
        description: 'Retorna pacientes que tienen seguro médico registrado.'
    })
    @ApiQuery({
        name: 'provider',
        required: false,
        type: String,
        description: 'Filtrar por proveedor de seguro',
        example: 'IMSS'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de pacientes con seguro',
        type: [PatientResponseDto]
    })
    async findWithInsurance(
        @Query('provider') provider?: string
    ): Promise<PatientResponseDto[]> {
        return await this.patientsService.findWithInsurance(provider);
    }

    /**
     * Obtener pacientes recientes
     * GET /api/patients/recent/list
     */
    @Get('recent/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener pacientes recientes',
        description: 'Retorna los pacientes registrados más recientemente.'
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
        description: 'Lista de pacientes recientes',
        type: [PatientResponseDto]
    })
    async findRecent(
        @Query('limit') limit?: number
    ): Promise<PatientResponseDto[]> {
        return await this.patientsService.findRecent(limit || 10);
    }

    /**
     * Obtener pacientes con más citas
     * GET /api/patients/most-appointments/list
     */
    @Get('most-appointments/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener pacientes con más citas',
        description: 'Retorna los pacientes ordenados por cantidad de citas.'
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
        description: 'Lista de pacientes con más citas',
        type: [PatientResponseDto]
    })
    async findMostAppointments(
        @Query('limit') limit?: number
    ): Promise<PatientResponseDto[]> {
        return await this.patientsService.findMostAppointments(limit || 10);
    }

    /**
     * Actualizar paciente
     * PATCH /api/patients/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar paciente',
        description: 'Actualiza los datos de un paciente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente a actualizar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Paciente actualizado exitosamente',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El nuevo email ya está en uso' 
    })
    // @Roles('ADMIN', 'PATIENT') // Descomentar cuando implementes decorador de roles
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updatePatientDto: UpdatePatientDto
    ): Promise<PatientResponseDto> {
        return await this.patientsService.update(id, updatePatientDto);
    }

    /**
     * Actualizar contacto de emergencia
     * PATCH /api/patients/:id/emergency-contact
     */
    @Patch(':id/emergency-contact')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar contacto de emergencia',
        description: 'Actualiza la información del contacto de emergencia del paciente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Contacto de emergencia actualizado exitosamente',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    async updateEmergencyContact(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { emergencyContactName: string; emergencyContactPhone: string }
    ): Promise<PatientResponseDto> {
        return await this.patientsService.updateEmergencyContact(
            id,
            body.emergencyContactName,
            body.emergencyContactPhone
        );
    }

    /**
     * Actualizar seguro médico
     * PATCH /api/patients/:id/insurance
     */
    @Patch(':id/insurance')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar seguro médico',
        description: 'Actualiza la información del seguro médico del paciente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Seguro médico actualizado exitosamente',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    async updateInsurance(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { insuranceProvider: string; insuranceNumber: string }
    ): Promise<PatientResponseDto> {
        return await this.patientsService.updateInsurance(
            id,
            body.insuranceProvider,
            body.insuranceNumber
        );
    }

    /**
     * Actualizar tipo de sangre
     * PATCH /api/patients/:id/blood-type
     */
    @Patch(':id/blood-type')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar tipo de sangre',
        description: 'Actualiza el tipo de sangre del paciente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Tipo de sangre actualizado exitosamente',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Tipo de sangre inválido' 
    })
    async updateBloodType(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { bloodType: string }
    ): Promise<PatientResponseDto> {
        return await this.patientsService.updateBloodType(id, body.bloodType);
    }

    /**
     * Desactivar paciente
     * PATCH /api/patients/:id/deactivate
     */
    @Patch(':id/deactivate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Desactivar paciente',
        description: 'Desactiva un paciente y su usuario asociado.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente a desactivar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Paciente desactivado exitosamente',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async deactivate(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<PatientResponseDto> {
        return await this.patientsService.deactivate(id);
    }

    /**
     * Activar paciente
     * PATCH /api/patients/:id/activate
     */
    @Patch(':id/activate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Activar paciente',
        description: 'Reactiva un paciente previamente desactivado.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente a activar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Paciente activado exitosamente',
        type: PatientResponseDto
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async activate(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<PatientResponseDto> {
        return await this.patientsService.activate(id);
    }

    /**
     * Eliminar paciente permanentemente
     * DELETE /api/patients/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Eliminar paciente',
        description: 'Elimina un paciente permanentemente del sistema. Acción irreversible.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente a eliminar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Paciente eliminado exitosamente',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Paciente eliminado exitosamente' }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'No se puede eliminar el paciente por citas activas' 
    })
    // @Roles('ADMIN') // Descomentar cuando implementes guards
    async delete(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<{ message: string }> {
        await this.patientsService.delete(id);
        return { message: 'Paciente eliminado exitosamente' };
    }

    /**
     * Verificar si tiene seguro médico
     * GET /api/patients/:id/has-insurance
     */
    @Get(':id/has-insurance')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Verificar seguro médico',
        description: 'Verifica si el paciente tiene seguro médico registrado.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultado de la verificación',
        schema: {
            type: 'object',
            properties: {
                patientId: { type: 'string', example: 'uuid-123-456' },
                hasInsurance: { type: 'boolean', example: true }
            }
        }
    })
    async hasInsurance(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<{ patientId: string; hasInsurance: boolean }> {
        const hasInsurance = await this.patientsService.hasInsurance(id);
        return { patientId: id, hasInsurance };
    }

    /**
     * Contar pacientes
     * GET /api/patients/stats/count
     */
    @Get('stats/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar pacientes',
        description: 'Retorna el total de pacientes en el sistema.'
    })
    @ApiQuery({
        name: 'onlyActive',
        required: false,
        type: Boolean,
        description: 'Contar solo pacientes activos',
        example: true
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number', example: 350 },
                onlyActive: { type: 'boolean', example: true }
            }
        }
    })
    async count(
        @Query('onlyActive') onlyActive?: boolean
    ): Promise<{ total: number; onlyActive: boolean }> {
        const total = await this.patientsService.count(onlyActive || false);
        return { 
            total, 
            onlyActive: onlyActive || false
        };
    }

    /**
     * Contar por tipo de sangre
     * GET /api/patients/stats/count-by-blood-type/:bloodType
     */
    @Get('stats/count-by-blood-type/:bloodType')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar por tipo de sangre',
        description: 'Retorna la cantidad de pacientes con un tipo de sangre específico.'
    })
    @ApiParam({
        name: 'bloodType',
        description: 'Tipo de sangre',
        example: 'O+'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
            type: 'object',
            properties: {
                bloodType: { type: 'string', example: 'O+' },
                count: { type: 'number', example: 85 }
            }
        }
    })
    async countByBloodType(
        @Param('bloodType') bloodType: string
    ): Promise<{ bloodType: string; count: number }> {
        const count = await this.patientsService.countByBloodType(bloodType);
        return { bloodType, count };
    }

    /**
     * Distribución de tipos de sangre
     * GET /api/patients/stats/blood-type-distribution
     */
    @Get('stats/blood-type-distribution')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Distribución de tipos de sangre',
        description: 'Retorna la distribución de tipos de sangre entre todos los pacientes.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Distribución obtenida',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    bloodType: { type: 'string', example: 'O+' },
                    count: { type: 'number', example: 85 }
                }
            }
        }
    })
    async getBloodTypeDistribution(): Promise<any[]> {
        return await this.patientsService.getBloodTypeDistribution();
    }

    /**
     * Estadísticas generales
     * GET /api/patients/stats/general
     */
    @Get('stats/general')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Estadísticas generales',
        description: 'Retorna estadísticas generales de todos los pacientes.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Estadísticas obtenidas',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number' },
                active: { type: 'number' },
                inactive: { type: 'number' },
                withInsurance: { type: 'number' },
                withoutInsurance: { type: 'number' },
                bloodTypeDistribution: { type: 'array' },
                totalAppointments: { type: 'number' },
                averageAppointmentsPerPatient: { type: 'number' }
            }
        }
    })
    async getGeneralStatistics(): Promise<any> {
        return await this.patientsService.getGeneralStatistics();
    }

    /**
     * Estadísticas de un paciente
     * GET /api/patients/:id/statistics
     */
    @Get(':id/statistics')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Estadísticas del paciente',
        description: 'Retorna estadísticas detalladas de un paciente específico.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Estadísticas obtenidas',
        schema: {
            type: 'object',
            properties: {
                patientId: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                bloodType: { type: 'string' },
                hasInsurance: { type: 'boolean' },
                totalAppointments: { type: 'number' },
                completedAppointments: { type: 'number' },
                cancelledAppointments: { type: 'number' },
                upcomingAppointments: { type: 'number' },
                totalMedicalRecords: { type: 'number' },
                totalConsultations: { type: 'number' }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    async getStatistics(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<any> {
        return await this.patientsService.getStatistics(id);
    }

    /**
     * Historial completo del paciente
     * GET /api/patients/:id/full-history
     */
    @Get(':id/full-history')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Historial completo',
        description: 'Retorna el historial completo del paciente (citas, consultas, registros médicos).'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del paciente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Historial obtenido',
        schema: {
            type: 'object',
            properties: {
                patient: { type: 'object' },
                appointments: { type: 'array' },
                consultations: { type: 'array' },
                medicalRecords: { type: 'array' }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Paciente no encontrado' 
    })
    async getFullHistory(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<any> {
        return await this.patientsService.getFullHistory(id);
    }
}