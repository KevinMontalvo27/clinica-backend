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
import { DoctorSchedulesService } from '../services/doctor-schedules.service';
import { CreateScheduleDto } from '../dtos/create-schedule.dto';
import { UpdateScheduleDto } from '../dtos/update-schedule.dto';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';

@ApiTags('doctor-schedules')
@Controller('schedules')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class DoctorSchedulesController {
  constructor(private readonly schedulesService: DoctorSchedulesService) {}

  /**
   * Crear un nuevo horario para un doctor
   * POST /api/schedules
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear horario de doctor',
    description: 'Crea un nuevo horario de trabajo para un doctor. Valida que no haya solapamientos.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Horario creado exitosamente'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflicto - Horario se solapa con uno existente' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async create(@Body() createScheduleDto: CreateScheduleDto): Promise<DoctorSchedule> {
    return await this.schedulesService.create(createScheduleDto);
  }

  /**
   * Crear múltiples horarios de una vez
   * POST /api/schedules/bulk
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear múltiples horarios',
    description: 'Crea varios horarios de una vez. Útil para configuración inicial.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Horarios creados exitosamente'
  })
  // @Roles('ADMIN', 'DOCTOR')
  async createBulk(@Body() schedules: CreateScheduleDto[]): Promise<DoctorSchedule[]> {
    return await this.schedulesService.createBulk(schedules);
  }

  /**
   * Obtener todos los horarios con filtros
   * GET /api/schedules
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener todos los horarios',
    description: 'Lista todos los horarios con filtros opcionales.'
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: String,
    description: 'Filtrar por doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'dayOfWeek',
    required: false,
    type: Number,
    description: 'Filtrar por día de la semana (0-6)',
    example: 1
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Solo horarios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de horarios obtenida exitosamente'
  })
  async findAll(
    @Query('doctorId') doctorId?: string,
    @Query('dayOfWeek', new ParseIntPipe({ optional: true })) dayOfWeek?: number,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<DoctorSchedule[]> {
    return await this.schedulesService.findAll(
      doctorId, 
      dayOfWeek, 
      onlyActive !== false
    );
  }

  /**
   * Obtener un horario por ID
   * GET /api/schedules/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener horario por ID',
    description: 'Retorna los detalles de un horario específico.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del horario',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Horario encontrado'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Horario no encontrado' 
  })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<DoctorSchedule> {
    return await this.schedulesService.findById(id);
  }

  /**
   * Obtener todos los horarios de un doctor
   * GET /api/schedules/doctor/:doctorId
   */
  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener horarios de un doctor',
    description: 'Lista todos los horarios de un doctor específico.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Solo horarios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de horarios del doctor'
  })
  async findByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<DoctorSchedule[]> {
    return await this.schedulesService.findByDoctor(doctorId, onlyActive !== false);
  }

  /**
   * Obtener horarios de un doctor para un día específico
   * GET /api/schedules/doctor/:doctorId/day/:dayOfWeek
   */
  @Get('doctor/:doctorId/day/:dayOfWeek')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener horarios por día',
    description: 'Lista los horarios de un doctor para un día de la semana específico.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiParam({
    name: 'dayOfWeek',
    description: 'Día de la semana (0=Domingo, 6=Sábado)',
    example: 1
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Solo horarios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de horarios para ese día'
  })
  async findByDoctorAndDay(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<DoctorSchedule[]> {
    return await this.schedulesService.findByDoctorAndDay(
      doctorId, 
      dayOfWeek, 
      onlyActive !== false
    );
  }

  /**
   * Obtener horarios de un doctor para una fecha específica
   * GET /api/schedules/doctor/:doctorId/date
   */
  @Get('doctor/:doctorId/date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener horarios por fecha',
    description: 'Lista los horarios de un doctor para una fecha específica.'
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
    description: 'Fecha en formato YYYY-MM-DD',
    example: '2025-11-15'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de horarios para esa fecha'
  })
  async findByDoctorAndDate(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string
  ): Promise<DoctorSchedule[]> {
    const dateObj = new Date(date);
    return await this.schedulesService.findByDoctorAndDate(doctorId, dateObj);
  }

  /**
   * Actualizar un horario
   * PATCH /api/schedules/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar horario',
    description: 'Actualiza un horario existente. Valida solapamientos.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del horario a actualizar',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Horario actualizado exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Horario no encontrado' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflicto con otro horario' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateScheduleDto: UpdateScheduleDto
  ): Promise<DoctorSchedule> {
    return await this.schedulesService.update(id, updateScheduleDto);
  }

  /**
   * Activar un horario
   * PATCH /api/schedules/:id/activate
   */
  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Activar horario',
    description: 'Activa un horario previamente desactivado.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del horario',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Horario activado exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Horario no encontrado' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflicto al activar - se solapa con otro horario activo' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async activate(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<DoctorSchedule> {
    return await this.schedulesService.activate(id);
  }

  /**
   * Desactivar un horario
   * PATCH /api/schedules/:id/deactivate
   */
  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Desactivar horario',
    description: 'Desactiva un horario sin eliminarlo permanentemente.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del horario',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Horario desactivado exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Horario no encontrado' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async deactivate(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<DoctorSchedule> {
    return await this.schedulesService.deactivate(id);
  }

  /**
   * Eliminar un horario permanentemente
   * DELETE /api/schedules/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar horario',
    description: 'Elimina permanentemente un horario del sistema.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del horario a eliminar',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Horario eliminado exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Horario no encontrado' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<{ message: string }> {
    await this.schedulesService.delete(id);
    return { message: 'Horario eliminado exitosamente' };
  }

  /**
   * Eliminar todos los horarios de un doctor
   * DELETE /api/schedules/doctor/:doctorId/all
   */
  @Delete('doctor/:doctorId/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar todos los horarios de un doctor',
    description: 'Elimina permanentemente todos los horarios de un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Horarios eliminados exitosamente'
  })
  // @Roles('ADMIN')
  async deleteAllByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<{ message: string }> {
    await this.schedulesService.deleteAllByDoctor(doctorId);
    return { message: 'Todos los horarios del doctor fueron eliminados exitosamente' };
  }

  /**
   * Duplicar horarios de un día a otro
   * POST /api/schedules/doctor/:doctorId/duplicate
   */
  @Post('doctor/:doctorId/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Duplicar horarios',
    description: 'Copia los horarios de un día de la semana a otro día.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Horarios duplicados exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No se encontraron horarios para el día origen' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async duplicateSchedulesToDay(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Body() body: { sourceDayOfWeek: number; targetDayOfWeek: number }
  ): Promise<DoctorSchedule[]> {
    return await this.schedulesService.duplicateSchedulesToDay(
      doctorId,
      body.sourceDayOfWeek,
      body.targetDayOfWeek
    );
  }

  /**
   * Verificar si un doctor tiene horarios configurados
   * GET /api/schedules/doctor/:doctorId/has-schedules
   */
  @Get('doctor/:doctorId/has-schedules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verificar si tiene horarios',
    description: 'Verifica si un doctor tiene al menos un horario activo configurado.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la verificación'
  })
  async hasDoctorSchedules(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<{ doctorId: string; hasSchedules: boolean }> {
    const hasSchedules = await this.schedulesService.hasDoctorSchedules(doctorId);
    return { doctorId, hasSchedules };
  }

  /**
   * Obtener días laborales de un doctor
   * GET /api/schedules/doctor/:doctorId/working-days
   */
  @Get('doctor/:doctorId/working-days')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener días laborales',
    description: 'Lista los días de la semana en los que el doctor trabaja.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de días laborales (0=Domingo, 6=Sábado)'
  })
  async getWorkingDays(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<{ doctorId: string; workingDays: number[]; dayNames: string[] }> {
    const workingDays = await this.schedulesService.getWorkingDays(doctorId);
    const dayNames = workingDays.map(day => this.schedulesService.getDayName(day));
    
    return { 
      doctorId, 
      workingDays,
      dayNames
    };
  }

  /**
   * Obtener próximo día disponible
   * GET /api/schedules/doctor/:doctorId/next-available-day
   */
  @Get('doctor/:doctorId/next-available-day')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener próximo día disponible',
    description: 'Retorna la próxima fecha en la que el doctor tiene horario configurado.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Fecha desde la cual buscar (por defecto: hoy)',
    example: '2025-11-15'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Próximo día disponible encontrado'
  })
  async getNextAvailableDay(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('fromDate') fromDate?: string
  ): Promise<{ doctorId: string; nextAvailableDay: Date | null }> {
    const date = fromDate ? new Date(fromDate) : new Date();
    const nextDay = await this.schedulesService.getNextAvailableDay(doctorId, date);
    
    return { 
      doctorId, 
      nextAvailableDay: nextDay 
    };
  }

  /**
   * Verificar si doctor trabaja en una fecha
   * GET /api/schedules/doctor/:doctorId/is-working
   */
  @Get('doctor/:doctorId/is-working')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verificar si trabaja en fecha',
    description: 'Verifica si el doctor tiene horarios configurados para una fecha específica.'
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
    example: '2025-11-15'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la verificación'
  })
  async isDoctorWorkingOnDate(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string
  ): Promise<{ doctorId: string; date: string; isWorking: boolean }> {
    const dateObj = new Date(date);
    const isWorking = await this.schedulesService.isDoctorWorkingOnDate(doctorId, dateObj);
    
    return { 
      doctorId, 
      date,
      isWorking 
    };
  }

  /**
   * Obtener rango de horas de trabajo
   * GET /api/schedules/doctor/:doctorId/working-hours-range
   */
  @Get('doctor/:doctorId/working-hours-range')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener rango de horas',
    description: 'Retorna el rango de horas (más temprana y más tardía) que el doctor trabaja en una fecha.'
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
    description: 'Rango de horas obtenido'
  })
  async getWorkingHoursRange(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('date') date: string
  ): Promise<{ doctorId: string; date: string; range: { start: string; end: string } | null }> {
    const dateObj = new Date(date);
    const range = await this.schedulesService.getWorkingHoursRange(doctorId, dateObj);
    
    return { 
      doctorId, 
      date,
      range 
    };
  }

  /**
   * Obtener estadísticas de horarios de un doctor
   * GET /api/schedules/doctor/:doctorId/stats
   */
  @Get('doctor/:doctorId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener estadísticas de horarios',
    description: 'Retorna estadísticas detalladas de los horarios del doctor.'
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
  async getDoctorScheduleStats(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<any> {
    return await this.schedulesService.getDoctorScheduleStats(doctorId);
  }
}