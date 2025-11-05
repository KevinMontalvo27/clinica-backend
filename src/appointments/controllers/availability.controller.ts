import { 
  Controller, 
  Get, 
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
import { AvailabilityService, TimeSlot, DayAvailability } from '../services/availability.service';

@ApiTags('availability')
@Controller('availability')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /**
   * Obtener slots disponibles de un doctor en una fecha
   * GET /api/availability/doctor/:doctorId
   */
  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener slots disponibles',
    description: 'Lista los slots de tiempo disponibles de un doctor para una fecha específica.'
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
    description: 'Fecha a consultar (YYYY-MM-DD)',
    example: '2025-11-15'
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    type: Number,
    description: 'Duración del slot en minutos',
    example: 30
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de slots disponibles'
  })
  async getAvailableSlots(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string,
    @Query('duration', new ParseIntPipe({ optional: true })) duration?: number
  ): Promise<{ doctorId: string; date: string; slots: TimeSlot[] }> {
    const slots = await this.availabilityService.getAvailableSlots(
      doctorId,
      new Date(date),
      duration || 30
    );

    return {
      doctorId,
      date,
      slots
    };
  }

  /**
   * Verificar si un slot específico está disponible
   * GET /api/availability/doctor/:doctorId/check
   */
  @Get('doctor/:doctorId/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verificar disponibilidad de slot',
    description: 'Verifica si un horario específico está disponible para agendar.'
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
    description: 'Fecha (YYYY-MM-DD)',
    example: '2025-11-15'
  })
  @ApiQuery({
    name: 'time',
    required: true,
    type: String,
    description: 'Hora (HH:MM:SS)',
    example: '10:00:00'
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    type: Number,
    description: 'Duración en minutos',
    example: 30
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la verificación'
  })
  async isTimeSlotAvailable(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string,
    @Query('time') time: string,
    @Query('duration', new ParseIntPipe({ optional: true })) duration?: number
  ): Promise<{ 
    doctorId: string; 
    date: string; 
    time: string; 
    duration: number;
    available: boolean; 
    reason?: string 
  }> {
    const result = await this.availabilityService.isTimeSlotAvailable(
      doctorId,
      new Date(date),
      time,
      duration || 30
    );

    return {
      doctorId,
      date,
      time,
      duration: duration || 30,
      ...result
    };
  }

  /**
   * Obtener próximos slots disponibles
   * GET /api/availability/doctor/:doctorId/next-available
   */
  @Get('doctor/:doctorId/next-available')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener próximos slots disponibles',
    description: 'Lista los próximos N slots disponibles desde una fecha.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Fecha desde la cual buscar (por defecto: hoy)',
    example: '2025-11-15'
  })
  @ApiQuery({
    name: 'count',
    required: false,
    type: Number,
    description: 'Cantidad de slots a retornar',
    example: 10
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    type: Number,
    description: 'Duración del slot en minutos',
    example: 30
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de próximos slots disponibles'
  })
  async getNextAvailableSlots(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('from') from?: string,
    @Query('count', new ParseIntPipe({ optional: true })) count?: number,
    @Query('duration', new ParseIntPipe({ optional: true })) duration?: number
  ): Promise<{ doctorId: string; fromDate: string; slots: any[] }> {
    const fromDate = from ? new Date(from) : new Date();
    const slots = await this.availabilityService.getNextAvailableSlots(
      doctorId,
      fromDate,
      count || 10,
      duration || 30
    );

    return {
      doctorId,
      fromDate: fromDate.toISOString().split('T')[0],
      slots
    };
  }

  /**
   * Obtener primer slot disponible
   * GET /api/availability/doctor/:doctorId/first-available
   */
  @Get('doctor/:doctorId/first-available')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener primer slot disponible',
    description: 'Retorna el primer slot disponible desde una fecha.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Fecha desde la cual buscar (por defecto: hoy)',
    example: '2025-11-15'
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    type: Number,
    description: 'Duración del slot en minutos',
    example: 30
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Primer slot disponible encontrado'
  })
  async getFirstAvailableSlot(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('from') from?: string,
    @Query('duration', new ParseIntPipe({ optional: true })) duration?: number
  ): Promise<{ doctorId: string; firstAvailable: any | null }> {
    const fromDate = from ? new Date(from) : new Date();
    const slot = await this.availabilityService.getFirstAvailableSlot(
      doctorId,
      fromDate,
      duration || 30
    );

    return {
      doctorId,
      firstAvailable: slot
    };
  }

  /**
   * Obtener disponibilidad de una semana
   * GET /api/availability/doctor/:doctorId/week
   */
  @Get('doctor/:doctorId/week')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener disponibilidad de una semana',
    description: 'Retorna la disponibilidad completa de 7 días consecutivos.'
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
    description: 'Fecha de inicio de la semana',
    example: '2025-11-15'
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    type: Number,
    description: 'Duración del slot en minutos',
    example: 30
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Disponibilidad de la semana'
  })
  async getWeekAvailability(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('startDate') startDate: string,
    @Query('duration', new ParseIntPipe({ optional: true })) duration?: number
  ): Promise<{ doctorId: string; startDate: string; days: DayAvailability[] }> {
    const days = await this.availabilityService.getWeekAvailability(
      doctorId,
      new Date(startDate),
      duration || 30
    );

    return {
      doctorId,
      startDate,
      days
    };
  }

  /**
   * Obtener disponibilidad de un mes
   * GET /api/availability/doctor/:doctorId/month
   */
  @Get('doctor/:doctorId/month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener disponibilidad de un mes',
    description: 'Retorna la disponibilidad completa de un mes específico.'
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
    example: 11
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    type: Number,
    description: 'Duración del slot en minutos',
    example: 30
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Disponibilidad del mes'
  })
  async getMonthAvailability(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('duration', new ParseIntPipe({ optional: true })) duration?: number
  ): Promise<{ doctorId: string; year: number; month: number; days: DayAvailability[] }> {
    const days = await this.availabilityService.getMonthAvailability(
      doctorId,
      year,
      month,
      duration || 30
    );

    return {
      doctorId,
      year,
      month,
      days
    };
  }

  /**
   * Obtener resumen de disponibilidad
   * GET /api/availability/doctor/:doctorId/summary
   */
  @Get('doctor/:doctorId/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener resumen de disponibilidad',
    description: 'Retorna un resumen de disponibilidad por día sin detalles de slots.'
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
    description: 'Resumen de disponibilidad'
  })
  async getAvailabilitySummary(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<{ 
    doctorId: string; 
    startDate: string; 
    endDate: string; 
    summary: any[] 
  }> {
    const summary = await this.availabilityService.getAvailabilitySummary(
      doctorId,
      new Date(startDate),
      new Date(endDate)
    );

    return {
      doctorId,
      startDate,
      endDate,
      summary
    };
  }

  /**
   * Verificar si hay disponibilidad en un rango
   * GET /api/availability/doctor/:doctorId/has-availability
   */
  @Get('doctor/:doctorId/has-availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verificar disponibilidad en rango',
    description: 'Verifica si el doctor tiene al menos un slot disponible en un rango de fechas.'
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
    description: 'Resultado de la verificación'
  })
  async hasAvailabilityInRange(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<{ 
    doctorId: string; 
    startDate: string; 
    endDate: string; 
    hasAvailability: boolean 
  }> {
    const hasAvailability = await this.availabilityService.hasAvailabilityInRange(
      doctorId,
      new Date(startDate),
      new Date(endDate)
    );

    return {
      doctorId,
      startDate,
      endDate,
      hasAvailability
    };
  }

  /**
   * Obtener estadísticas de disponibilidad
   * GET /api/availability/doctor/:doctorId/stats
   */
  @Get('doctor/:doctorId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener estadísticas de disponibilidad',
    description: 'Retorna estadísticas de disponibilidad del doctor en un rango de fechas.'
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
    description: 'Estadísticas de disponibilidad'
  })
  async getAvailabilityStats(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<any> {
    return await this.availabilityService.getAvailabilityStats(
      doctorId,
      new Date(startDate),
      new Date(endDate)
    );
  }
}