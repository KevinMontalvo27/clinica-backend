import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Service } from '../entities/service.entity';

export interface CreateServiceDto {
  doctorId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  /**
   * Crea un nuevo servicio para un doctor
   */
  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    // Validar precio
    if (createServiceDto.price < 0) {
      throw new BadRequestException('El precio no puede ser negativo');
    }

    // Validar duración
    if (createServiceDto.duration < 1) {
      throw new BadRequestException('La duración debe ser al menos 1 minuto');
    }

    // Verificar si ya existe un servicio con el mismo nombre para ese doctor
    const existingService = await this.serviceRepository.findOne({
      where: {
        doctorId: createServiceDto.doctorId,
        name: createServiceDto.name
      }
    });

    if (existingService) {
      throw new ConflictException(
        `Ya existe un servicio con el nombre "${createServiceDto.name}" para este doctor`
      );
    }

    const service = this.serviceRepository.create(createServiceDto);
    return await this.serviceRepository.save(service);
  }

  /**
   * Obtiene todos los servicios con filtros
   */
  async findAll(
    doctorId?: string,
    onlyActive: boolean = true,
    search?: string
  ): Promise<Service[]> {
    const qb = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.specialty', 'specialty');

    if (doctorId) {
      qb.andWhere('service.doctorId = :doctorId', { doctorId });
    }

    if (onlyActive) {
      qb.andWhere('service.isActive = :isActive', { isActive: true });
    }

    if (search) {
      qb.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    qb.orderBy('service.name', 'ASC');

    return await qb.getMany();
  }

  /**
   * Obtiene un servicio por su ID
   */
  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'doctor.specialty']
    });

    if (!service) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    return service;
  }

  /**
   * Obtiene todos los servicios de un doctor
   */
  async findByDoctor(
    doctorId: string,
    onlyActive: boolean = true
  ): Promise<Service[]> {
    const where: any = { doctorId };
    if (onlyActive) {
      where.isActive = true;
    }

    return await this.serviceRepository.find({
      where,
      order: { name: 'ASC' }
    });
  }

  /**
   * Obtiene servicios por especialidad
   */
  async findBySpecialty(
    specialtyId: string,
    onlyActive: boolean = true
  ): Promise<Service[]> {
    const qb = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .where('doctor.specialtyId = :specialtyId', { specialtyId });

    if (onlyActive) {
      qb.andWhere('service.isActive = :isActive', { isActive: true })
        .andWhere('doctor.isAvailable = :isAvailable', { isAvailable: true })
        .andWhere('user.isActive = :userIsActive', { userIsActive: true });
    }

    qb.orderBy('service.name', 'ASC');

    return await qb.getMany();
  }

  /**
   * Busca servicios por nombre o descripción
   */
  async search(searchTerm: string, onlyActive: boolean = true): Promise<Service[]> {
    const qb = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .where(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${searchTerm}%` }
      );

    if (onlyActive) {
      qb.andWhere('service.isActive = :isActive', { isActive: true });
    }

    qb.orderBy('service.name', 'ASC');

    return await qb.getMany();
  }

  /**
   * Obtiene servicios por rango de precios
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    onlyActive: boolean = true
  ): Promise<Service[]> {
    const qb = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .where('service.price >= :minPrice', { minPrice })
      .andWhere('service.price <= :maxPrice', { maxPrice });

    if (onlyActive) {
      qb.andWhere('service.isActive = :isActive', { isActive: true });
    }

    qb.orderBy('service.price', 'ASC');

    return await qb.getMany();
  }

  /**
   * Obtiene servicios por duración máxima
   */
  async findByMaxDuration(
    maxDuration: number,
    onlyActive: boolean = true
  ): Promise<Service[]> {
    const qb = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .where('service.duration <= :maxDuration', { maxDuration });

    if (onlyActive) {
      qb.andWhere('service.isActive = :isActive', { isActive: true });
    }

    qb.orderBy('service.duration', 'ASC');

    return await qb.getMany();
  }

  /**
   * Actualiza un servicio
   */
  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);

    // Validar precio si se proporciona
    if (updateServiceDto.price !== undefined && updateServiceDto.price < 0) {
      throw new BadRequestException('El precio no puede ser negativo');
    }

    // Validar duración si se proporciona
    if (updateServiceDto.duration !== undefined && updateServiceDto.duration < 1) {
      throw new BadRequestException('La duración debe ser al menos 1 minuto');
    }

    // Verificar nombre duplicado si se está cambiando
    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.serviceRepository.findOne({
        where: {
          doctorId: service.doctorId,
          name: updateServiceDto.name
        }
      });

      if (existingService) {
        throw new ConflictException(
          `Ya existe un servicio con el nombre "${updateServiceDto.name}" para este doctor`
        );
      }
    }

    Object.assign(service, updateServiceDto);
    return await this.serviceRepository.save(service);
  }

  /**
   * Activa un servicio
   */
  async activate(id: string): Promise<Service> {
    const service = await this.findById(id);
    service.isActive = true;
    return await this.serviceRepository.save(service);
  }

  /**
   * Desactiva un servicio
   */
  async deactivate(id: string): Promise<Service> {
    const service = await this.findById(id);
    service.isActive = false;
    return await this.serviceRepository.save(service);
  }

  /**
   * Elimina un servicio permanentemente
   */
  async delete(id: string): Promise<void> {
    const service = await this.findById(id);

    // Aquí podrías verificar si el servicio tiene citas asociadas
    // y decidir si permitir la eliminación o no

    await this.serviceRepository.remove(service);
  }

  /**
   * Elimina todos los servicios de un doctor
   */
  async deleteAllByDoctor(doctorId: string): Promise<void> {
    const services = await this.serviceRepository.find({
      where: { doctorId }
    });

    if (services.length > 0) {
      await this.serviceRepository.remove(services);
    }
  }

  /**
   * Verifica si un doctor tiene servicios configurados
   */
  async hasDoctorServices(doctorId: string): Promise<boolean> {
    const count = await this.serviceRepository.count({
      where: { doctorId, isActive: true }
    });

    return count > 0;
  }

  /**
   * Cuenta servicios por doctor
   */
  async countByDoctor(doctorId: string, onlyActive: boolean = true): Promise<number> {
    const where: any = { doctorId };
    if (onlyActive) {
      where.isActive = true;
    }

    return await this.serviceRepository.count({ where });
  }

  /**
   * Obtiene el servicio más caro de un doctor
   */
  async getMostExpensiveByDoctor(doctorId: string): Promise<Service | null> {
    return await this.serviceRepository.findOne({
      where: { doctorId, isActive: true },
      order: { price: 'DESC' }
    });
  }

  /**
   * Obtiene el servicio más económico de un doctor
   */
  async getCheapestByDoctor(doctorId: string): Promise<Service | null> {
    return await this.serviceRepository.findOne({
      where: { doctorId, isActive: true },
      order: { price: 'ASC' }
    });
  }

  /**
   * Obtiene el servicio de mayor duración de un doctor
   */
  async getLongestByDoctor(doctorId: string): Promise<Service | null> {
    return await this.serviceRepository.findOne({
      where: { doctorId, isActive: true },
      order: { duration: 'DESC' }
    });
  }

  /**
   * Obtiene el servicio de menor duración de un doctor
   */
  async getShortestByDoctor(doctorId: string): Promise<Service | null> {
    return await this.serviceRepository.findOne({
      where: { doctorId, isActive: true },
      order: { duration: 'ASC' }
    });
  }

  /**
   * Obtiene estadísticas de servicios de un doctor
   */
  async getDoctorServicesStats(doctorId: string): Promise<any> {
    const services = await this.findByDoctor(doctorId, false);
    const activeServices = services.filter(s => s.isActive);

    if (services.length === 0) {
      return {
        doctorId,
        total: 0,
        active: 0,
        inactive: 0,
        averagePrice: 0,
        averageDuration: 0,
        priceRange: { min: 0, max: 0 },
        durationRange: { min: 0, max: 0 }
      };
    }

    const prices = activeServices.map(s => Number(s.price));
    const durations = activeServices.map(s => s.duration);

    return {
      doctorId,
      total: services.length,
      active: activeServices.length,
      inactive: services.length - activeServices.length,
      averagePrice: prices.length > 0 
        ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
        : 0,
      averageDuration: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      },
      durationRange: {
        min: durations.length > 0 ? Math.min(...durations) : 0,
        max: durations.length > 0 ? Math.max(...durations) : 0
      }
    };
  }

  /**
   * Obtiene servicios más populares (basado en cantidad de citas - placeholder)
   */
  async getMostPopular(limit: number = 10): Promise<Service[]> {
    // TODO: Implementar cuando tengas relación con appointments
    // Por ahora retorna los servicios ordenados por nombre
    return await this.serviceRepository.find({
      where: { isActive: true },
      relations: ['doctor', 'doctor.user', 'doctor.specialty'],
      order: { name: 'ASC' },
      take: limit
    });
  }

  /**
   * Crea servicios por defecto para un doctor
   */
  async createDefaultServices(
    doctorId: string,
    specialtyName: string
  ): Promise<Service[]> {
    // Servicios básicos según especialidad
    const defaultServices: CreateServiceDto[] = [];

    // Servicios comunes para todas las especialidades
    defaultServices.push({
      doctorId,
      name: 'Consulta General',
      description: 'Consulta médica general',
      price: 500,
      duration: 30,
      isActive: true
    });

    defaultServices.push({
      doctorId,
      name: 'Consulta de Seguimiento',
      description: 'Consulta de seguimiento de tratamiento',
      price: 400,
      duration: 20,
      isActive: true
    });

    // Servicios específicos por especialidad
    if (specialtyName.toLowerCase().includes('cardio')) {
      defaultServices.push({
        doctorId,
        name: 'Electrocardiograma',
        description: 'Estudio de electrocardiograma',
        price: 800,
        duration: 30,
        isActive: true
      });
    }

    const createdServices: Service[] = [];

    for (const serviceDto of defaultServices) {
      try {
        const service = await this.create(serviceDto);
        createdServices.push(service);
      } catch (error) {
        // Si hay error, continuar con los demás
        console.error(`Error creando servicio por defecto:`, error.message);
      }
    }

    return createdServices;
  }

  /**
   * Duplica servicios de un doctor a otro
   */
  async duplicateServices(
    sourceDoctorId: string,
    targetDoctorId: string
  ): Promise<Service[]> {
    const sourceServices = await this.findByDoctor(sourceDoctorId, false);

    const duplicatedServices: Service[] = [];

    for (const source of sourceServices) {
      try {
        const newService = await this.create({
          doctorId: targetDoctorId,
          name: source.name,
          description: source.description,
          price: Number(source.price),
          duration: source.duration,
          isActive: source.isActive
        });

        duplicatedServices.push(newService);
      } catch (error) {
        // Si hay conflicto de nombre, continuar
        console.error(`Error duplicando servicio "${source.name}":`, error.message);
      }
    }

    return duplicatedServices;
  }

  /**
   * Actualiza precios de todos los servicios de un doctor (incremento/decremento)
   */
  async updateAllPrices(
    doctorId: string,
    percentageChange: number
  ): Promise<Service[]> {
    const services = await this.findByDoctor(doctorId, false);

    const updatedServices: Service[] = [];

    for (const service of services) {
      const currentPrice = Number(service.price);
      const newPrice = currentPrice + (currentPrice * percentageChange / 100);
      
      service.price = Math.round(newPrice * 100) / 100; // Redondear a 2 decimales
      
      const updated = await this.serviceRepository.save(service);
      updatedServices.push(updated);
    }

    return updatedServices;
  }
}