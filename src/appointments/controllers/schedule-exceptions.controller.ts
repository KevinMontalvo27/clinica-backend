import { 
  Controller, 
  Get, 
  Post, 
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
import { ScheduleExceptionsService } from '../services/schedule-exceptions.service';
import { CreateScheduleExceptionDto } from '../dtos/create-schedule-exception.dto';
import { ScheduleException } from '../entities/schedule-exception.entity';

@ApiTags('schedule-exceptions')
@Controller('schedule-exceptions')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class ScheduleExceptionsController {
  constructor(private readonly exceptionsService: ScheduleExceptionsService) {}

  /**
   * Crear una nueva excepción de horario
   * POST /api/schedule-exceptions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear excepción de horario',
    description: 'Crea una excepción (bloqueo) en el horario del doctor. Puede ser día completo o parcial.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Excepción creada exitosamente'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflicto - Ya existe una excepción que se solapa' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos o fecha en el pasado' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async create(@Body() createExceptionDto: CreateScheduleExceptionDto): Promise<ScheduleException> {
    return await this.exceptionsService.create(createExceptionDto);
  }

  /**
   * Crear excepciones para múltiples días (vacaciones)
   * POST /api/schedule-exceptions/bulk
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear excepciones múltiples',
    description: 'Crea excepciones para un rango de fechas. Útil para vacaciones o ausencias prolongadas.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Excepciones creadas exitosamente'
  })
  // @Roles('ADMIN', 'DOCTOR')
  async createMultipleDays(
    @Body() body: {
      doctorId: string;
      startDate: string;
      endDate: string;
      reason: string;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<ScheduleException[]> {
    return await this.exceptionsService.createMultipleDays(
      body.doctorId,
      new Date(body.startDate),
      new Date(body.endDate),
      body.reason,
      body.startTime,
      body.endTime
    );
  }

  /**
   * Obtener todas las excepciones con filtros
   * GET /api/schedule-exceptions
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener todas las excepciones',
    description: 'Lista todas las excepciones con filtros opcionales.'
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: String,
    description: 'Filtrar por doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio del rango',
    example: '2025-11-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin del rango',
    example: '2025-11-30'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de excepciones obtenida exitosamente'
  })
  async findAll(
    @Query('doctorId') doctorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ScheduleException[]> {
    return await this.exceptionsService.findAll(
      doctorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  /**
   * Obtener una excepción por ID
   * GET /api/schedule-exceptions/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener excepción por ID',
    description: 'Retorna los detalles de una excepción específica.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la excepción',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Excepción encontrada'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Excepción no encontrada' 
  })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<ScheduleException> {
    return await this.exceptionsService.findById(id);
  }

  /**
   * Obtener todas las excepciones de un doctor
   * GET /api/schedule-exceptions/doctor/:doctorId
   */
  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener excepciones de un doctor',
    description: 'Lista todas las excepciones de un doctor específico.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'includeExpired',
    required: false,
    type: Boolean,
    description: 'Incluir excepciones pasadas',
    example: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de excepciones del doctor'
  })
  async findByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('includeExpired') includeExpired?: boolean
  ): Promise<ScheduleException[]> {
    return await this.exceptionsService.findByDoctor(doctorId, includeExpired || false);
  }

  /**
   * Obtener excepciones de un doctor para una fecha específica
   * GET /api/schedule-exceptions/doctor/:doctorId/date
   */
  @Get('doctor/:doctorId/date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener excepciones por fecha',
    description: 'Lista las excepciones de un doctor para una fecha específica.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Fecha a consultar',
    example: '2025-12-25'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de excepciones para esa fecha'
  })
  async findByDoctorAndDate(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string
  ): Promise<ScheduleException[]> {
    return await this.exceptionsService.findByDoctorAndDate(doctorId, new Date(date));
  }

  /**
   * Obtener excepciones en un rango de fechas
   * GET /api/schedule-exceptions/doctor/:doctorId/date-range
   */
  @Get('doctor/:doctorId/date-range')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener excepciones por rango de fechas',
    description: 'Lista las excepciones de un doctor en un rango de fechas.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Fecha de inicio',
    example: '2025-11-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Fecha de fin',
    example: '2025-11-30'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de excepciones en el rango'
  })
  async findByDoctorAndDateRange(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<ScheduleException[]> {
    return await this.exceptionsService.findByDoctorAndDateRange(
      doctorId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  /**
   * Obtener próximas excepciones de un doctor
   * GET /api/schedule-exceptions/doctor/:doctorId/upcoming
   */
  @Get('doctor/:doctorId/upcoming')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener próximas excepciones',
    description: 'Lista las próximas excepciones del doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad máxima de resultados',
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de próximas excepciones'
  })
  async findUpcoming(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<ScheduleException[]> {
    return await this.exceptionsService.findUpcoming(doctorId, limit || 10);
  }

  /**
   * Verificar si hay excepción en una fecha/hora
   * GET /api/schedule-exceptions/doctor/:doctorId/check
   */
  @Get('doctor/:doctorId/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verificar excepción en fecha/hora',
    description: 'Verifica si existe una excepción para un doctor en una fecha y hora específicas.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Fecha a verificar',
    example: '2025-12-25'
  })
  @ApiQuery({
    name: 'time',
    required: false,
    type: String,
    description: 'Hora a verificar (opcional)',
    example: '14:00:00'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la verificación'
  })
  async hasExceptionOnDate(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string,
    @Query('time') time?: string
  ): Promise<{ doctorId: string; date: string; time?: string; hasException: boolean }> {
    const hasException = await this.exceptionsService.hasExceptionOnDate(
      doctorId,
      new Date(date),
      time
    );

    return {
      doctorId,
      date,
      time,
      hasException
    };
  }

  /**
   * Verificar si es día completo bloqueado
   * GET /api/schedule-exceptions/doctor/:doctorId/is-full-day
   */
  @Get('doctor/:doctorId/is-full-day')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verificar si es día completo bloqueado',
    description: 'Verifica si una fecha está completamente bloqueada para un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Fecha a verificar',
    example: '2025-12-25'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la verificación'
  })
  async isFullDayException(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string
  ): Promise<{ doctorId: string; date: string; isFullDay: boolean }> {
    const isFullDay = await this.exceptionsService.isFullDayException(
      doctorId,
      new Date(date)
    );

    return {
      doctorId,
      date,
      isFullDay
    };
  }

  /**
   * Obtener rangos de tiempo bloqueados en una fecha
   * GET /api/schedule-exceptions/doctor/:doctorId/blocked-times
   */
  @Get('doctor/:doctorId/blocked-times')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener rangos bloqueados',
    description: 'Lista los rangos de tiempo bloqueados para un doctor en una fecha.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Fecha a consultar',
    example: '2025-11-15'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de rangos bloqueados'
  })
  async getBlockedTimeRanges(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string
  ): Promise<{ doctorId: string; date: string; blockedRanges: any[] }> {
    const blockedRanges = await this.exceptionsService.getBlockedTimeRanges(
      doctorId,
      new Date(date)
    );

    return {
      doctorId,
      date,
      blockedRanges
    };
  }

  /**
   * Obtener días bloqueados en un mes
   * GET /api/schedule-exceptions/doctor/:doctorId/blocked-days-in-month
   */
  @Get('doctor/:doctorId/blocked-days-in-month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener días bloqueados en un mes',
    description: 'Lista los días completamente bloqueados en un mes específico.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Año',
    example: 2025
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Mes (1-12)',
    example: 12
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de días bloqueados'
  })
  async getBlockedDaysInMonth(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number
  ): Promise<{ doctorId: string; year: number; month: number; blockedDays: Date[] }> {
    const blockedDays = await this.exceptionsService.getBlockedDaysInMonth(
      doctorId,
      year,
      month
    );

    return {
      doctorId,
      year,
      month,
      blockedDays
    };
  }

  /**
   * Eliminar una excepción
   * DELETE /api/schedule-exceptions/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar excepción',
    description: 'Elimina permanentemente una excepción del sistema.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la excepción a eliminar',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Excepción eliminada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Excepción no encontrada' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<{ message: string }> {
    await this.exceptionsService.delete(id);
    return { message: 'Excepción eliminada exitosamente' };
  }

  /**
   * Eliminar todas las excepciones de un doctor
   * DELETE /api/schedule-exceptions/doctor/:doctorId/all
   */
  @Delete('doctor/:doctorId/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar todas las excepciones',
    description: 'Elimina todas las excepciones de un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Excepciones eliminadas exitosamente'
  })
  // @Roles('ADMIN')
  async deleteAllByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<{ message: string }> {
    await this.exceptionsService.deleteAllByDoctor(doctorId);
    return { message: 'Todas las excepciones del doctor fueron eliminadas exitosamente' };
  }

  /**
   * Eliminar todas las excepciones de una fecha
   * DELETE /api/schedule-exceptions/doctor/:doctorId/date
   */
  @Delete('doctor/:doctorId/date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar excepciones por fecha',
    description: 'Elimina todas las excepciones de un doctor en una fecha específica.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Fecha',
    example: '2025-12-25'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Excepciones eliminadas exitosamente'
  })
  // @Roles('ADMIN', 'DOCTOR')
  async deleteAllByDoctorAndDate(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string
  ): Promise<{ message: string }> {
    await this.exceptionsService.deleteAllByDoctorAndDate(doctorId, new Date(date));
    return { message: 'Excepciones de la fecha eliminadas exitosamente' };
  }

  /**
   * Eliminar excepciones expiradas
   * DELETE /api/schedule-exceptions/cleanup/expired
   */
  @Delete('cleanup/expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Limpiar excepciones expiradas',
    description: 'Elimina todas las excepciones con fechas pasadas.'
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: String,
    description: 'Filtrar por doctor (opcional)',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Excepciones expiradas eliminadas'
  })
  // @Roles('ADMIN')
  async deleteExpired(
    @Query('doctorId') doctorId?: string
  ): Promise<{ message: string; deletedCount: number }> {
    const deletedCount = await this.exceptionsService.deleteExpired(doctorId);
    return { 
      message: 'Excepciones expiradas eliminadas exitosamente',
      deletedCount
    };
  }

  /**
   * Obtener estadísticas de excepciones de un doctor
   * GET /api/schedule-exceptions/doctor/:doctorId/stats
   */
  @Get('doctor/:doctorId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener estadísticas de excepciones',
    description: 'Retorna estadísticas detalladas de las excepciones del doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas'
  })
  async getDoctorExceptionStats(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<any> {
    return await this.exceptionsService.getDoctorExceptionStats(doctorId);
  }

  @Get('doctor/:doctorId/count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Contar excepciones',
    description: 'Cuenta las excepciones de un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'onlyFuture',
    required: false,
    type: Boolean,
    description: 'Solo excepciones futuras',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conteo obtenido'
  })
  async countByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('onlyFuture') onlyFuture?: boolean
  ): Promise<{ doctorId: string; count: number; onlyFuture: boolean }> {
    const count = await this.exceptionsService.countByDoctor(
      doctorId,
      onlyFuture !== false
    );

    return {
      doctorId,
      count,
      onlyFuture: onlyFuture !== false
    };
  }
}
