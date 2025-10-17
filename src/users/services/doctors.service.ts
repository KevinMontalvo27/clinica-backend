import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { CreateDoctorDto } from '../dtos/doctors/create-doctor.dto';
import { UpdateDoctorDto } from '../dtos/doctors/update-doctor.dto';
import { DoctorQueryDto } from '../dtos/doctors/doctor-query.dto';
import { UpdateDoctorAvailabilityDto } from '../dtos/doctors/update-doctor-availability.dto';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
  ) {}

  /**
   * Crea un nuevo doctor
   * @param createDoctorDto - Datos del doctor a crear
   * @returns El doctor creado
   * @throws ConflictException si la cédula profesional ya existe
   */
  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    // Verificar que la cédula profesional no exista
    const existingLicense = await this.doctorRepository.findOne({
      where: { licenseNumber: createDoctorDto.licenseNumber }
    });

    if (existingLicense) {
      throw new ConflictException(
        `La cédula profesional ${createDoctorDto.licenseNumber} ya está registrada`
      );
    }

    // Obtener el ID del rol DOCTOR
    const doctorRole = await this.rolesService.findByName('DOCTOR');

    // Crear el usuario base primero
    const user = await this.usersService.create({
      ...createDoctorDto.user,
      roleId: doctorRole.id,
    });

    // Crear el perfil de doctor
    const doctor = this.doctorRepository.create({
      userId: user.id,
      specialtyId: createDoctorDto.specialtyId,
      licenseNumber: createDoctorDto.licenseNumber,
      yearsExperience: createDoctorDto.yearsExperience,
      education: createDoctorDto.education,
      certifications: createDoctorDto.certifications,
      consultationPrice: createDoctorDto.consultationPrice,
      biography: createDoctorDto.biography,
      profileImageUrl: createDoctorDto.profileImageUrl,
    });

    return await this.doctorRepository.save(doctor);
  }

  /**
   * Obtiene todos los doctores con filtros opcionales
   * @param query - Parámetros de filtrado y paginación
   * @returns Lista de doctores y total de registros
   */
  async findAll(query: DoctorQueryDto): Promise<[Doctor[], number]> {
    const qb = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .leftJoinAndSelect('user.role', 'role');

    // Búsqueda por nombre
    if (query.search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Filtro por especialidad
    if (query.specialtyId) {
      qb.andWhere('doctor.specialtyId = :specialtyId', { 
        specialtyId: query.specialtyId 
      });
    }

    // Filtro por disponibilidad
    if (query.isAvailable !== undefined) {
      qb.andWhere('doctor.isAvailable = :isAvailable', { 
        isAvailable: query.isAvailable 
      });
    }

    // Filtro por usuario activo
    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { 
        isActive: query.isActive 
      });
    }

    // Filtro por experiencia mínima
    if (query.minYearsExperience) {
      qb.andWhere('doctor.yearsExperience >= :minYears', { 
        minYears: query.minYearsExperience 
      });
    }

    // Filtro por precio máximo
    if (query.maxPrice) {
      qb.andWhere('doctor.consultationPrice <= :maxPrice', { 
        maxPrice: query.maxPrice 
      });
    }

    // Ordenamiento
    if (query.sortBy) {
      const sortField = ['yearsExperience', 'consultationPrice'].includes(query.sortBy)
        ? `doctor.${query.sortBy}`
        : query.sortBy === 'createdAt'
        ? 'doctor.createdAt'
        : `user.${query.sortBy}`;
      
      qb.orderBy(sortField, query.order || 'DESC');
    } else {
      qb.orderBy('doctor.createdAt', 'DESC');
    }

    // Paginación
    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    return await qb.getManyAndCount();
  }

  /**
   * Obtiene un doctor por su ID
   * @param id - ID del doctor
   * @returns El doctor encontrado
   * @throws NotFoundException si el doctor no existe
   */
  async findById(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user', 'user.role', 'specialty', 'schedules', 'appointments']
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
    }

    return doctor;
  }

  /**
   * Obtiene un doctor por el ID del usuario
   * @param userId - ID del usuario
   * @returns El doctor encontrado
   * @throws NotFoundException si el doctor no existe
   */
  async findByUserId(userId: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { userId },
      relations: ['user', 'user.role', 'specialty']
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor con userId ${userId} no encontrado`);
    }

    return doctor;
  }

  /**
   * Obtiene doctores por especialidad
   * @param specialtyId - ID de la especialidad
   * @param onlyAvailable - Si true, solo retorna doctores disponibles
   * @returns Lista de doctores
   */
  async findBySpecialty(specialtyId: string, onlyAvailable: boolean = true): Promise<Doctor[]> {
    const whereCondition: any = { 
      specialtyId,
      user: { isActive: true }
    };

    if (onlyAvailable) {
      whereCondition.isAvailable = true;
    }

    return await this.doctorRepository.find({
      where: whereCondition,
      relations: ['user', 'specialty'],
      order: { yearsExperience: 'DESC' }
    });
  }

  /**
   * Obtiene doctores disponibles para agendar
   * @returns Lista de doctores disponibles
   */
  async findAvailable(): Promise<Doctor[]> {
    return await this.doctorRepository.find({
      where: { 
        isAvailable: true,
        user: { isActive: true }
      },
      relations: ['user', 'specialty'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca doctores por nombre
   * @param searchTerm - Término de búsqueda
   * @returns Lista de doctores que coinciden
   */
  async search(searchTerm: string): Promise<Doctor[]> {
    return await this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .where(
        'user.firstName ILIKE :search OR user.lastName ILIKE :search',
        { search: `%${searchTerm}%` }
      )
      .andWhere('user.isActive = :active', { active: true })
      .getMany();
  }

  /**
   * Actualiza un doctor
   * @param id - ID del doctor a actualizar
   * @param updateDoctorDto - Datos a actualizar
   * @returns El doctor actualizado
   * @throws NotFoundException si el doctor no existe
   */
  async update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findById(id);

    // Si hay datos del usuario, actualizarlos
    if (updateDoctorDto.user) {
      await this.usersService.update(doctor.userId, updateDoctorDto.user);
    }

    // Actualizar datos del doctor
    const { user, ...doctorData } = updateDoctorDto;
    Object.assign(doctor, doctorData);

    return await this.doctorRepository.save(doctor);
  }

  /**
   * Actualiza la disponibilidad del doctor
   * @param id - ID del doctor
   * @param updateAvailabilityDto - Nueva disponibilidad
   * @returns El doctor actualizado
   */
  async updateAvailability(
    id: string, 
    updateAvailabilityDto: UpdateDoctorAvailabilityDto
  ): Promise<Doctor> {
    const doctor = await this.findById(id);
    doctor.isAvailable = updateAvailabilityDto.isAvailable;
    return await this.doctorRepository.save(doctor);
  }

  /**
   * Desactiva un doctor (desactiva su usuario)
   * @param id - ID del doctor
   * @returns El doctor desactivado
   */
  async deactivate(id: string): Promise<Doctor> {
    const doctor = await this.findById(id);
    
    // Desactivar el usuario
    await this.usersService.deactivate(doctor.userId);
    
    // Marcar como no disponible
    doctor.isAvailable = false;
    return await this.doctorRepository.save(doctor);
  }

  /**
   * Activa un doctor (activa su usuario)
   * @param id - ID del doctor
   * @returns El doctor activado
   */
  async activate(id: string): Promise<Doctor> {
    const doctor = await this.findById(id);
    
    // Activar el usuario
    await this.usersService.activate(doctor.userId);
    
    return await this.findById(id);
  }

  /**
   * Elimina un doctor permanentemente
   * @param id - ID del doctor a eliminar
   * @throws BadRequestException si tiene citas activas
   */
  async delete(id: string): Promise<void> {
    const doctor = await this.findById(id);

    // Verificar que no tenga citas futuras
    // Esta validación se debe implementar cuando tengas el módulo de appointments
    // const futureAppointments = await this.appointmentsService.countFutureByDoctor(id);
    // if (futureAppointments > 0) {
    //   throw new BadRequestException('No se puede eliminar el doctor porque tiene citas programadas');
    // }

    // Eliminar el doctor (esto también eliminará el usuario por CASCADE)
    await this.doctorRepository.remove(doctor);
  }

  /**
   * Verifica si una cédula profesional existe
   * @param licenseNumber - Número de cédula
   * @returns true si existe, false si no
   */
  async licenseExists(licenseNumber: string): Promise<boolean> {
    const doctor = await this.doctorRepository.findOne({
      where: { licenseNumber }
    });
    return !!doctor;
  }

  /**
   * Cuenta el total de doctores
   * @param onlyActive - Si true, solo cuenta doctores activos
   * @param onlyAvailable - Si true, solo cuenta doctores disponibles
   * @returns Cantidad de doctores
   */
  async count(onlyActive: boolean = false, onlyAvailable: boolean = false): Promise<number> {
    const whereCondition: any = {};

    if (onlyActive) {
      whereCondition.user = { isActive: true };
    }

    if (onlyAvailable) {
      whereCondition.isAvailable = true;
    }

    return await this.doctorRepository.count({ where: whereCondition });
  }

  /**
   * Cuenta doctores por especialidad
   * @param specialtyId - ID de la especialidad
   * @returns Cantidad de doctores
   */
  async countBySpecialty(specialtyId: string): Promise<number> {
    return await this.doctorRepository.count({
      where: { 
        specialtyId,
        isAvailable: true,
        user: { isActive: true }
      }
    });
  }

  /**
   * Obtiene estadísticas de un doctor
   * @param id - ID del doctor
   * @returns Estadísticas del doctor
   */
  async getStatistics(id: string): Promise<any> {
    const doctor = await this.findById(id);

    // Estas estadísticas se completarán cuando implementes appointments
    return {
      doctorId: doctor.id,
      name: `${doctor.user.firstName} ${doctor.user.lastName}`,
      specialty: doctor.specialty.name,
      totalAppointments: 0, // await this.appointmentsService.countByDoctor(id)
      completedAppointments: 0,
      cancelledAppointments: 0,
      totalPatients: 0,
      averageRating: 0,
      totalEarnings: 0,
    };
  }

  /**
   * Obtiene los doctores más populares
   * @param limit - Cantidad de doctores a retornar
   * @returns Lista de doctores ordenados por popularidad
   */
  async findMostPopular(limit: number = 10): Promise<Doctor[]> {
    // Esta implementación se completará cuando tengas el módulo de appointments
    // Por ahora retorna los doctores con más experiencia
    return await this.doctorRepository.find({
      where: { 
        isAvailable: true,
        user: { isActive: true }
      },
      relations: ['user', 'specialty'],
      order: { yearsExperience: 'DESC' },
      take: limit
    });
  }
}