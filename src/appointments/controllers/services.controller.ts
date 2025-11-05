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
import * as servicesService_1 from '../services/services.service';
import { Service } from '../entities/service.entity';

@ApiTags('services')
@Controller('services')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: servicesService_1.ServicesService) {}

  /**
   * Crear un nuevo servicio
   * POST /api/services
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear servicio médico',
    description: 'Crea un nuevo servicio que ofrece un doctor.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Servicio creado exitosamente'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Ya existe un servicio con ese nombre para el doctor' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async create(@Body() createServiceDto: servicesService_1.CreateServiceDto): Promise<Service> {
    return await this.servicesService.create(createServiceDto);
  }

  /**
   * Crear servicios por defecto para un doctor
   * POST /api/services/doctor/:doctorId/defaults
   */
  @Post('doctor/:doctorId/defaults')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear servicios por defecto',
    description: 'Crea servicios básicos predefinidos para un doctor según su especialidad.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Servicios por defecto creados'
  })
  // @Roles('ADMIN', 'DOCTOR')
  async createDefaultServices(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Body() body: { specialtyName: string }
  ): Promise<Service[]> {
    return await this.servicesService.createDefaultServices(
      doctorId,
      body.specialtyName
    );
  }

  /**
   * Duplicar servicios de un doctor a otro
   * POST /api/services/duplicate
   */
  @Post('duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Duplicar servicios',
    description: 'Copia todos los servicios de un doctor a otro doctor.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Servicios duplicados exitosamente'
  })
  // @Roles('ADMIN')
  async duplicateServices(
    @Body() body: { sourceDoctorId: string; targetDoctorId: string }
  ): Promise<Service[]> {
    return await this.servicesService.duplicateServices(
      body.sourceDoctorId,
      body.targetDoctorId
    );
  }

  /**
   * Obtener todos los servicios con filtros
   * GET /api/services
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener todos los servicios',
    description: 'Lista todos los servicios con filtros opcionales.'
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: String,
    description: 'Filtrar por doctor',
    example: 'uuid-doctor-123'
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Solo servicios activos',
    example: true
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nombre o descripción',
    example: 'consulta'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de servicios'
  })
  async findAll(
    @Query('doctorId') doctorId?: string,
    @Query('onlyActive') onlyActive?: boolean,
    @Query('search') search?: string
  ): Promise<Service[]> {
    return await this.servicesService.findAll(
      doctorId,
      onlyActive !== false,
      search
    );
  }

  /**
   * Obtener un servicio por ID
   * GET /api/services/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener servicio por ID',
    description: 'Retorna los detalles de un servicio específico.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del servicio',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio encontrado'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Servicio no encontrado' 
  })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<Service> {
    return await this.servicesService.findById(id);
  }

  /**
   * Obtener servicios de un doctor
   * GET /api/services/doctor/:doctorId
   */
  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener servicios de un doctor',
    description: 'Lista todos los servicios que ofrece un doctor.'
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
    description: 'Solo servicios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de servicios del doctor'
  })
  async findByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<Service[]> {
    return await this.servicesService.findByDoctor(doctorId, onlyActive !== false);
  }

  /**
   * Obtener servicios por especialidad
   * GET /api/services/specialty/:specialtyId
   */
  @Get('specialty/:specialtyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener servicios por especialidad',
    description: 'Lista los servicios ofrecidos por doctores de una especialidad.'
  })
  @ApiParam({
    name: 'specialtyId',
    description: 'UUID de la especialidad',
    example: 'uuid-specialty-123'
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Solo servicios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de servicios de la especialidad'
  })
  async findBySpecialty(
    @Param('specialtyId', new ParseUUIDPipe()) specialtyId: string,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<Service[]> {
    return await this.servicesService.findBySpecialty(specialtyId, onlyActive !== false);
  }

  /**
   * Buscar servicios
   * GET /api/services/search/query
   */
  @Get('search/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Buscar servicios',
    description: 'Busca servicios por nombre o descripción.'
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Término de búsqueda',
    example: 'consulta'
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Solo servicios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultados de búsqueda'
  })
  async search(
    @Query('q') searchTerm: string,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<Service[]> {
    return await this.servicesService.search(searchTerm, onlyActive !== false);
  }

  /**
   * Obtener servicios por rango de precios
   * GET /api/services/price-range
   */
  @Get('filter/price-range')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Filtrar por rango de precios',
    description: 'Lista servicios dentro de un rango de precios.'
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
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Solo servicios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicios en el rango de precios'
  })
  async findByPriceRange(
    @Query('minPrice', ParseFloatPipe) minPrice: number,
    @Query('maxPrice', ParseFloatPipe) maxPrice: number,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<Service[]> {
    return await this.servicesService.findByPriceRange(
      minPrice,
      maxPrice,
      onlyActive !== false
    );
  }

  /**
   * Obtener servicios por duración máxima
   * GET /api/services/max-duration
   */
  @Get('filter/max-duration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Filtrar por duración máxima',
    description: 'Lista servicios con duración menor o igual a la especificada.'
  })
  @ApiQuery({
    name: 'maxDuration',
    required: true,
    type: Number,
    description: 'Duración máxima en minutos',
    example: 60
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description: 'Solo servicios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicios dentro de la duración'
  })
  async findByMaxDuration(
    @Query('maxDuration', ParseIntPipe) maxDuration: number,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<Service[]> {
    return await this.servicesService.findByMaxDuration(
      maxDuration,
      onlyActive !== false
    );
  }

  /**
   * Obtener servicios más populares
   * GET /api/services/popular/list
   */
  @Get('popular/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener servicios populares',
    description: 'Lista los servicios más populares (más solicitados).'
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
    description: 'Lista de servicios populares'
  })
  async getMostPopular(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<Service[]> {
    return await this.servicesService.getMostPopular(limit || 10);
  }

  /**
   * Actualizar un servicio
   * PATCH /api/services/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar servicio',
    description: 'Actualiza los datos de un servicio.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del servicio',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio actualizado exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Servicio no encontrado' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateServiceDto: servicesService_1.UpdateServiceDto
  ): Promise<Service> {
    return await this.servicesService.update(id, updateServiceDto);
  }

  /**
   * Actualizar precios de todos los servicios de un doctor
   * PATCH /api/services/doctor/:doctorId/update-prices
   */
  @Patch('doctor/:doctorId/update-prices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar precios masivamente',
    description: 'Aumenta o disminuye todos los precios de un doctor por un porcentaje.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Precios actualizados exitosamente'
  })
  // @Roles('ADMIN', 'DOCTOR')
  async updateAllPrices(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Body() body: { percentageChange: number }
  ): Promise<Service[]> {
    return await this.servicesService.updateAllPrices(
      doctorId,
      body.percentageChange
    );
  }

  /**
   * Activar un servicio
   * PATCH /api/services/:id/activate
   */
  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Activar servicio',
    description: 'Activa un servicio previamente desactivado.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del servicio',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio activado exitosamente'
  })
  // @Roles('ADMIN', 'DOCTOR')
  async activate(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<Service> {
    return await this.servicesService.activate(id);
  }

  /**
   * Desactivar un servicio
   * PATCH /api/services/:id/deactivate
   */
  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Desactivar servicio',
    description: 'Desactiva un servicio sin eliminarlo.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del servicio',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio desactivado exitosamente'
  })
  // @Roles('ADMIN', 'DOCTOR')
  async deactivate(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<Service> {
    return await this.servicesService.deactivate(id);
  }

  /**
   * Eliminar un servicio
   * DELETE /api/services/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar servicio',
    description: 'Elimina permanentemente un servicio.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del servicio',
    example: 'uuid-123-456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio eliminado exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Servicio no encontrado' 
  })
  // @Roles('ADMIN', 'DOCTOR')
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string
  ): Promise<{ message: string }> {
    await this.servicesService.delete(id);
    return { message: 'Servicio eliminado exitosamente' };
  }

  /**
   * Eliminar todos los servicios de un doctor
   * DELETE /api/services/doctor/:doctorId/all
   */
  @Delete('doctor/:doctorId/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Eliminar todos los servicios de un doctor',
    description: 'Elimina permanentemente todos los servicios de un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicios eliminados exitosamente'
  })
  // @Roles('ADMIN')
  async deleteAllByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<{ message: string }> {
    await this.servicesService.deleteAllByDoctor(doctorId);
    return { message: 'Todos los servicios del doctor fueron eliminados exitosamente' };
  }

  /**
   * Verificar si un doctor tiene servicios
   * GET /api/services/doctor/:doctorId/has-services
   */
  @Get('doctor/:doctorId/has-services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verificar si tiene servicios',
    description: 'Verifica si un doctor tiene servicios activos configurados.'
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
  async hasDoctorServices(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<{ doctorId: string; hasServices: boolean }> {
    const hasServices = await this.servicesService.hasDoctorServices(doctorId);
    return { doctorId, hasServices };
  }

  /**
   * Contar servicios de un doctor
   * GET /api/services/doctor/:doctorId/count
   */
  @Get('doctor/:doctorId/count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Contar servicios',
    description: 'Cuenta los servicios de un doctor.'
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
    description: 'Solo servicios activos',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conteo obtenido'
  })
  async countByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string,
    @Query('onlyActive') onlyActive?: boolean
  ): Promise<{ doctorId: string; count: number }> {
    const count = await this.servicesService.countByDoctor(
      doctorId,
      onlyActive !== false
    );
    return { doctorId, count };
  }

  /**
   * Obtener servicio más caro de un doctor
   * GET /api/services/doctor/:doctorId/most-expensive
   */
  @Get('doctor/:doctorId/most-expensive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener servicio más caro',
    description: 'Retorna el servicio con mayor precio de un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio más caro encontrado'
  })
  async getMostExpensiveByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<Service | null> {
    return await this.servicesService.getMostExpensiveByDoctor(doctorId);
  }

  /**
   * Obtener servicio más económico de un doctor
   * GET /api/services/doctor/:doctorId/cheapest
   */
  @Get('doctor/:doctorId/cheapest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener servicio más económico',
    description: 'Retorna el servicio con menor precio de un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio más económico encontrado'
  })
  async getCheapestByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<Service | null> {
    return await this.servicesService.getCheapestByDoctor(doctorId);
  }

  /**
   * Obtener servicio de mayor duración
   * GET /api/services/doctor/:doctorId/longest
   */
  @Get('doctor/:doctorId/longest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener servicio más largo',
    description: 'Retorna el servicio con mayor duración de un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio más largo encontrado'
  })
  async getLongestByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<Service | null> {
    return await this.servicesService.getLongestByDoctor(doctorId);
  }

  /**
   * Obtener servicio de menor duración
   * GET /api/services/doctor/:doctorId/shortest
   */
  @Get('doctor/:doctorId/shortest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener servicio más corto',
    description: 'Retorna el servicio con menor duración de un doctor.'
  })
  @ApiParam({
    name: 'doctorId',
    description: 'UUID del doctor',
    example: 'uuid-doctor-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio más corto encontrado'
  })
  async getShortestByDoctor(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<Service | null> {
    return await this.servicesService.getShortestByDoctor(doctorId);
  }

  /**
   * Obtener estadísticas de servicios
   * GET /api/services/doctor/:doctorId/stats
   */
  @Get('doctor/:doctorId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener estadísticas de servicios',
    description: 'Retorna estadísticas detalladas de los servicios de un doctor.'
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
  async getDoctorServicesStats(
    @Param('doctorId', new ParseUUIDPipe()) doctorId: string
  ): Promise<any> {
    return await this.servicesService.getDoctorServicesStats(doctorId);
  }
}