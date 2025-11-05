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
import { AppointmentsService } from '../services/appointments.service';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { UpdateAppointmentDto } from '../dtos/update-appointment.dto';
import { UpdateAppointmentStatusDto, AppointmentStatus } from '../dtos/update-appointment-status.dto';
import { RescheduleAppointmentDto } from '../dtos/reschedule-appointment.dto';
import { CancelAppointmentDto } from '../dtos/cancel-appointment.dto';
import { AppointmentQueryDto } from '../dtos/appointment-query.dto';
import { Appointment } from '../entities/appointment.entity';

@ApiTags('appointments')
@Controller('appointments')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Crear una nueva cita
   * POST /api/appointments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear nueva cita',
    description: 'Crea una nueva cita médica. Valida disponibilidad del doctor y evita conflictos de horario.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Cita creada exitosamente'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflicto de horario - El doctor ya tiene una cita' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos o cita en el pasado' 
  })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    // @CurrentUser('id') userId: string
  ): Promise<Appointment> {
    const userId = 'system'; // Temporal
    return await this.appointmentsService.create(createAppointmentDto, userId);
  }

  /**
   * Obtener todas las citas con filtros
   * GET /api/appointments
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener todas las citas',
    description: 'Lista todas las citas con filtros opcionales por doctor, paciente, estado y fechas.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de citas obtenida exitosamente'
  })
  async findAll(
    @Query() query: AppointmentQueryDto
  ): Promise<{ data: Appointment[]; total: number; page: number; limit: number; totalPages: number }> {
    const [appointments, total] = await this.appointmentsService.findAll(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    
    return {
      data: appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Obtener cita por ID
   * GET /api/appointments/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener cita por ID',
    description: 'Retorna los detalles completos de una cita incluyendo paciente, doctor y historial.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita encontrada'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<Appointment> {
    return await this.appointmentsService.findById(id);
  }

  /**
   * Obtener citas de un doctor
   * GET /api/appointments/doctor/:doctorId
   */
  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener citas de un doctor',
    description: 'Lista todas las citas de un doctor específico con filtro opcional de fechas.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio',
    example: '2025-11-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin',
    example: '2025-11-30'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de citas del doctor'
  })
  async findByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<Appointment[]> {
    return await this.appointmentsService.findByDoctor(doctorId, startDate, endDate);
  }

  /**
   * Obtener citas de un paciente
   * GET /api/appointments/patient/:patientId
   */
  @Get('patient/:patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener citas de un paciente',
    description: 'Lista todas las citas de un paciente específico con filtro opcional de fechas.'
  })
  @ApiParam({
    name: 'patientId',
    description: 'UUID del paciente',
    example: 'uuid-patient-456'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio',
    example: '2025-11-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin',
    example: '2025-11-30'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de citas del paciente'
  })
  async findByPatient(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<Appointment[]> {
    return await this.appointmentsService.findByPatient(patientId, startDate, endDate);
  }

  /**
   * Obtener citas por estado
   * GET /api/appointments/status/:status
   */
  @Get('status/:status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener citas por estado',
    description: 'Lista todas las citas con un estado específico.'
  })
  @ApiParam({
    name: 'status',
    description: 'Estado de la cita',
    example: 'SCHEDULED',
    enum: AppointmentStatus
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de citas con ese estado'
  })
  async findByStatus(
    @Param('status') status: AppointmentStatus
  ): Promise<Appointment[]> {
    return await this.appointmentsService.findByStatus(status);
  }

  /**
   * Obtener citas de hoy
   * GET /api/appointments/today/list
   */
  @Get('today/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener citas de hoy',
    description: 'Lista todas las citas programadas para el día actual.'
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: String,
    description: 'Filtrar por doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de citas de hoy'
  })
  async findToday(
    @Query('doctorId') doctorId?: string
  ): Promise<Appointment[]> {
    return await this.appointmentsService.findToday(doctorId);
  }

  /**
   * Obtener citas próximas
   * GET /api/appointments/upcoming/list
   */
  @Get('upcoming/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener citas próximas',
    description: 'Lista las citas programadas para los próximos 7 días.'
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    type: String,
    description: 'Filtrar por paciente',
    example: 'uuid-patient-456'
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: String,
    description: 'Filtrar por doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de citas próximas'
  })
  async findUpcoming(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string
  ): Promise<Appointment[]> {
    return await this.appointmentsService.findUpcoming(patientId, doctorId);
  }

  /**
   * Actualizar cita
   * PATCH /api/appointments/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar cita',
    description: 'Actualiza los datos de una cita. Valida conflictos si se cambia fecha/hora.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita a actualizar',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita actualizada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflicto de horario' 
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    // @CurrentUser('id') userId: string
  ): Promise<Appointment> {
    const userId = 'system'; // Temporal
    return await this.appointmentsService.update(id, updateAppointmentDto, userId);
  }

  /**
   * Actualizar estado de cita
   * PATCH /api/appointments/:id/status
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar estado de cita',
    description: 'Cambia el estado de una cita y registra el cambio en el historial.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado actualizado exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
    // @CurrentUser('id') userId: string
  ): Promise<Appointment> {
    const userId = 'system'; // Temporal
    return await this.appointmentsService.updateStatus(id, updateStatusDto, userId);
  }

  /**
   * Confirmar cita
   * PATCH /api/appointments/:id/confirm
   */
  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Confirmar cita',
    description: 'Marca una cita como confirmada.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita confirmada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  async confirm(
    @Param('id', new ParseUUIDPipe()) id: string,
    // @CurrentUser('id') userId: string
  ): Promise<Appointment> {
    const userId = 'system'; // Temporal
    return await this.appointmentsService.confirm(id, userId);
  }

  /**
   * Completar cita
   * PATCH /api/appointments/:id/complete
   */
  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Completar cita',
    description: 'Marca una cita como completada.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita completada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  async complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    // @CurrentUser('id') userId: string
  ): Promise<Appointment> {
    const userId = 'system'; // Temporal
    return await this.appointmentsService.complete(id, userId);
  }

  /**
   * Marcar como no se presentó
   * PATCH /api/appointments/:id/no-show
   */
  @Patch(':id/no-show')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Marcar como no show',
    description: 'Marca una cita cuando el paciente no se presenta.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita marcada como no show'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  async markAsNoShow(
    @Param('id', new ParseUUIDPipe()) id: string,
    // @CurrentUser('id') userId: string
  ): Promise<Appointment> {
    const userId = 'system'; // Temporal
    return await this.appointmentsService.markAsNoShow(id, userId);
  }

  /**
   * Reagendar cita
   * PATCH /api/appointments/:id/reschedule
   */
  @Patch(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reagendar cita',
    description: 'Cambia la fecha y hora de una cita. Valida disponibilidad en el nuevo horario.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita reagendada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflicto de horario en la nueva fecha' 
  })
  async reschedule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() rescheduleDto: RescheduleAppointmentDto,
    // @CurrentUser('id') userId: string
  ): Promise<Appointment> {
    const userId = 'system'; // Temporal
    return await this.appointmentsService.reschedule(id, rescheduleDto, userId);
  }

  /**
   * Cancelar cita
   * PATCH /api/appointments/:id/cancel
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancelar cita',
    description: 'Cancela una cita. Requiere razón de cancelación.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita cancelada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'La cita ya está cancelada o completada' 
  })
  async cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() cancelDto: CancelAppointmentDto,
    // @CurrentUser('id') userId: string
  ): Promise<Appointment> {
    const userId = 'system'; // Temporal
    return await this.appointmentsService.cancel(id, cancelDto, userId);
  }

  /**
   * Eliminar cita
   * DELETE /api/appointments/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar cita',
    description: 'Elimina permanentemente una cita del sistema. Acción irreversible.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita a eliminar',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita eliminada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  // @Roles('ADMIN')
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<{ message: string }> {
    await this.appointmentsService.delete(id);
    return { message: 'Cita eliminada exitosamente' };
  }

  /**
   * Obtener historial de cambios de una cita
   * GET /api/appointments/:id/history
   */
  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener historial de cita',
    description: 'Retorna el historial completo de cambios de una cita.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la cita',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial obtenido exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada' 
  })
  async getHistory(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<any[]> {
    return await this.appointmentsService.getHistory(id);
  }

  /**
   * Obtener conteo por estado
   * GET /api/appointments/stats/count-by-status
   */
  @Get('stats/count-by-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Contar citas por estado',
    description: 'Retorna el conteo de citas agrupadas por estado.'
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: String,
    description: 'Filtrar por doctor'
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    type: String,
    description: 'Filtrar por paciente'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conteo obtenido'
  })
  async countByStatus(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string
  ): Promise<Record<string, number>> {
    return await this.appointmentsService.countByStatus(doctorId, patientId);
  }

  /**
   * Obtener estadísticas de citas
   * GET /api/appointments/stats/general
   */
  @Get('stats/general')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener estadísticas generales',
    description: 'Retorna estadísticas generales de citas incluyendo tasas de completitud y cancelación.'
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: String,
    description: 'Filtrar por doctor'
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    type: String,
    description: 'Filtrar por paciente'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas'
  })
  async getStatistics(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string
  ): Promise<any> {
    return await this.appointmentsService.getStatistics(doctorId, patientId);
  }
}