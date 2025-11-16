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
import { MedicalRecordsService } from '../services/medical-record.service';
import { CreateMedicalRecordDto } from '../dtos/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../dtos/update-medical-record.dto';
import { MedicalRecordQueryDto } from '../dtos/medical-record-query.dto';
import { MedicalRecord } from '../entities/medical-record.entity';

@ApiTags('medical-records')
@Controller('medical-records')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class MedicalRecordsController {
    constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

    /**
     * Crear un nuevo expediente médico
     * POST /api/medical-records
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Crear nuevo expediente médico',
        description: 'Crea un expediente médico para un paciente. Solo se permite un expediente por paciente.'
    })
    @ApiResponse({ 
        status: 201, 
        description: 'Expediente creado exitosamente'
    })
    @ApiResponse({ 
        status: 409, 
        description: 'El paciente ya tiene un expediente médico' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Datos inválidos' 
    })
    async create(@Body() createMedicalRecordDto: CreateMedicalRecordDto): Promise<MedicalRecord> {
        return await this.medicalRecordsService.create(createMedicalRecordDto);
    }

    /**
     * Obtener todos los expedientes con filtros
     * GET /api/medical-records
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener todos los expedientes médicos',
        description: 'Lista todos los expedientes con filtros opcionales por paciente, doctor, alergias y enfermedades.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de expedientes obtenida exitosamente'
    })
    async findAll(
        @Query() query: MedicalRecordQueryDto
    ): Promise<{ data: MedicalRecord[]; total: number; page: number; limit: number; totalPages: number }> {
        const [records, total] = await this.medicalRecordsService.findAll(query);
        const page = query.page || 1;
        const limit = query.limit || 10;
        
        return {
            data: records,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Obtener expediente por ID
     * GET /api/medical-records/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener expediente por ID',
        description: 'Retorna los detalles completos de un expediente médico.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del expediente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Expediente encontrado'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Expediente no encontrado' 
    })
    async findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<MedicalRecord> {
        return await this.medicalRecordsService.findById(id);
    }

    /**
     * Obtener expediente de un paciente
     * GET /api/medical-records/patient/:patientId
     */
    @Get('patient/:patientId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener expediente de un paciente',
        description: 'Retorna el expediente médico de un paciente específico.'
    })
    @ApiParam({
        name: 'patientId',
        description: 'UUID del paciente',
        example: 'uuid-patient-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Expediente encontrado'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'El paciente no tiene expediente médico' 
    })
    async findByPatient(@Param('patientId', new ParseUUIDPipe()) patientId: string): Promise<MedicalRecord> {
        return await this.medicalRecordsService.findByPatient(patientId);
    }

    /**
     * Obtener expedientes creados por un doctor
     * GET /api/medical-records/doctor/:doctorId
     */
    @Get('doctor/:doctorId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener expedientes creados por un doctor',
        description: 'Lista todos los expedientes médicos creados por un doctor específico.'
    })
    @ApiParam({
        name: 'doctorId',
        description: 'UUID del doctor',
        example: 'uuid-doctor-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de expedientes del doctor'
    })
    async findByDoctor(@Param('doctorId', new ParseUUIDPipe()) doctorId: string): Promise<MedicalRecord[]> {
        return await this.medicalRecordsService.findByDoctor(doctorId);
    }

    /**
     * Buscar expedientes por alergia
     * GET /api/medical-records/search/allergy
     */
    @Get('search/allergy')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Buscar expedientes por alergia',
        description: 'Busca expedientes que contengan una alergia específica.'
    })
    @ApiQuery({
        name: 'q',
        required: true,
        type: String,
        description: 'Término de búsqueda',
        example: 'penicilina'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultados de búsqueda'
    })
    async searchByAllergy(@Query('q') searchTerm: string): Promise<MedicalRecord[]> {
        return await this.medicalRecordsService.searchByAllergy(searchTerm);
    }

    /**
     * Buscar expedientes por enfermedad crónica
     * GET /api/medical-records/search/disease
     */
    @Get('search/disease')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Buscar expedientes por enfermedad',
        description: 'Busca expedientes que contengan una enfermedad crónica específica.'
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
    async searchByChronicDisease(@Query('q') searchTerm: string): Promise<MedicalRecord[]> {
        return await this.medicalRecordsService.searchByChronicDisease(searchTerm);
    }

    /**
     * Obtener expedientes con alergias
     * GET /api/medical-records/with-allergies/list
     */
    @Get('with-allergies/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener expedientes con alergias',
        description: 'Lista todos los expedientes que tienen alergias registradas.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de expedientes con alergias'
    })
    async findWithAllergies(): Promise<MedicalRecord[]> {
        return await this.medicalRecordsService.findWithAllergies();
    }

    /**
     * Obtener expedientes con enfermedades crónicas
     * GET /api/medical-records/with-chronic-diseases/list
     */
    @Get('with-chronic-diseases/list')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener expedientes con enfermedades crónicas',
        description: 'Lista todos los expedientes que tienen enfermedades crónicas registradas.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de expedientes con enfermedades crónicas'
    })
    async findWithChronicDiseases(): Promise<MedicalRecord[]> {
        return await this.medicalRecordsService.findWithChronicDiseases();
    }

    /**
     * Actualizar expediente por ID
     * PATCH /api/medical-records/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar expediente',
        description: 'Actualiza los datos de un expediente médico existente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del expediente a actualizar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Expediente actualizado exitosamente'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Expediente no encontrado' 
    })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateMedicalRecordDto: UpdateMedicalRecordDto
    ): Promise<MedicalRecord> {
        return await this.medicalRecordsService.update(id, updateMedicalRecordDto);
    }

    /**
     * Actualizar expediente por ID de paciente
     * PATCH /api/medical-records/patient/:patientId
     */
    @Patch('patient/:patientId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar expediente por paciente',
        description: 'Actualiza el expediente médico de un paciente usando su ID.'
    })
    @ApiParam({
        name: 'patientId',
        description: 'UUID del paciente',
        example: 'uuid-patient-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Expediente actualizado exitosamente'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'El paciente no tiene expediente médico' 
    })
    async updateByPatient(
        @Param('patientId', new ParseUUIDPipe()) patientId: string,
        @Body() updateMedicalRecordDto: UpdateMedicalRecordDto
    ): Promise<MedicalRecord> {
        return await this.medicalRecordsService.updateByPatient(patientId, updateMedicalRecordDto);
    }

    /**
     * Añadir información al historial médico
     * POST /api/medical-records/:id/append-history
     */
    @Post(':id/append-history')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Añadir al historial médico',
        description: 'Añade nueva información al historial médico del paciente con fecha.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del expediente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Historial actualizado exitosamente'
    })
    async appendMedicalHistory(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { additionalHistory: string }
    ): Promise<MedicalRecord> {
        return await this.medicalRecordsService.appendMedicalHistory(id, body.additionalHistory);
    }

    /**
     * Añadir alergia
     * POST /api/medical-records/:id/add-allergy
     */
    @Post(':id/add-allergy')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Añadir alergia',
        description: 'Añade una nueva alergia al expediente del paciente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del expediente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Alergia añadida exitosamente'
    })
    async addAllergy(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { allergy: string }
    ): Promise<MedicalRecord> {
        return await this.medicalRecordsService.addAllergy(id, body.allergy);
    }

    /**
     * Añadir enfermedad crónica
     * POST /api/medical-records/:id/add-disease
     */
    @Post(':id/add-disease')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Añadir enfermedad crónica',
        description: 'Añade una nueva enfermedad crónica al expediente del paciente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del expediente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Enfermedad añadida exitosamente'
    })
    async addChronicDisease(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { disease: string }
    ): Promise<MedicalRecord> {
        return await this.medicalRecordsService.addChronicDisease(id, body.disease);
    }

    /**
     * Actualizar medicamentos actuales
     * PATCH /api/medical-records/:id/medications
     */
    @Patch(':id/medications')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Actualizar medicamentos actuales',
        description: 'Actualiza la lista de medicamentos que el paciente está tomando actualmente.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del expediente',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Medicamentos actualizados exitosamente'
    })
    async updateCurrentMedications(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { medications: string }
    ): Promise<MedicalRecord> {
        return await this.medicalRecordsService.updateCurrentMedications(id, body.medications);
    }

    /**
     * Eliminar expediente
     * DELETE /api/medical-records/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Eliminar expediente',
        description: 'Elimina permanentemente un expediente médico del sistema.'
    })
    @ApiParam({
        name: 'id',
        description: 'UUID del expediente a eliminar',
        example: 'uuid-123-456'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Expediente eliminado exitosamente'
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Expediente no encontrado' 
    })
    async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ message: string }> {
        await this.medicalRecordsService.delete(id);
        return { message: 'Expediente eliminado exitosamente' };
    }

    /**
     * Verificar si paciente tiene expediente
     * GET /api/medical-records/patient/:patientId/exists
     */
    @Get('patient/:patientId/exists')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Verificar existencia de expediente',
        description: 'Verifica si un paciente tiene expediente médico registrado.'
    })
    @ApiParam({
        name: 'patientId',
        description: 'UUID del paciente',
        example: 'uuid-patient-123'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Resultado de la verificación',
        schema: {
            type: 'object',
            properties: {
                patientId: { type: 'string' },
                hasRecord: { type: 'boolean' }
            }
        }
    })
    async hasRecord(
        @Param('patientId', new ParseUUIDPipe()) patientId: string
    ): Promise<{ patientId: string; hasRecord: boolean }> {
        const hasRecord = await this.medicalRecordsService.hasRecord(patientId);
        return { patientId, hasRecord };
    }

    /**
     * Contar expedientes totales
     * GET /api/medical-records/stats/count
     */
    @Get('stats/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar expedientes',
        description: 'Retorna el total de expedientes médicos en el sistema.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Conteo obtenido',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number', example: 250 }
            }
        }
    })
    async count(): Promise<{ total: number }> {
        const total = await this.medicalRecordsService.count();
        return { total };
    }

    /**
     * Contar expedientes por doctor
     * GET /api/medical-records/doctor/:doctorId/count
     */
    @Get('doctor/:doctorId/count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Contar expedientes por doctor',
        description: 'Retorna el total de expedientes creados por un doctor.'
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
                doctorId: { type: 'string' },
                count: { type: 'number' }
            }
        }
    })
    async countByDoctor(
        @Param('doctorId', new ParseUUIDPipe()) doctorId: string
    ): Promise<{ doctorId: string; count: number }> {
        const count = await this.medicalRecordsService.countByDoctor(doctorId);
        return { doctorId, count };
    }

    /**
     * Obtener estadísticas generales
     * GET /api/medical-records/stats/general
     */
    @Get('stats/general')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener estadísticas generales',
        description: 'Retorna estadísticas generales de todos los expedientes médicos.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Estadísticas obtenidas',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number' },
                withAllergies: { type: 'number' },
                withChronicDiseases: { type: 'number' },
                withCurrentMedications: { type: 'number' },
                withFamilyHistory: { type: 'number' },
                percentageWithAllergies: { type: 'string' },
                percentageWithChronicDiseases: { type: 'string' }
            }
        }
    })
    async getGeneralStatistics(): Promise<any> {
        return await this.medicalRecordsService.getGeneralStatistics();
    }

    /**
     * Obtener alergias más comunes
     * GET /api/medical-records/stats/common-allergies
     */
    @Get('stats/common-allergies')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener alergias más comunes',
        description: 'Retorna las alergias más frecuentes en el sistema.'
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
        description: 'Lista de alergias más comunes',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    allergy: { type: 'string' },
                    count: { type: 'number' }
                }
            }
        }
    })
    async getCommonAllergies(
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
    ): Promise<any[]> {
        return await this.medicalRecordsService.getCommonAllergies(limit || 10);
    }

    /**
     * Obtener enfermedades crónicas más comunes
     * GET /api/medical-records/stats/common-diseases
     */
    @Get('stats/common-diseases')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Obtener enfermedades más comunes',
        description: 'Retorna las enfermedades crónicas más frecuentes en el sistema.'
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
        description: 'Lista de enfermedades más comunes',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    disease: { type: 'string' },
                    count: { type: 'number' }
                }
            }
        }
    })
    async getCommonChronicDiseases(
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
    ): Promise<any[]> {
        return await this.medicalRecordsService.getCommonChronicDiseases(limit || 10);
    }
}