import { 
    Injectable, 
    NotFoundException, 
    ConflictException,
    BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Specialty } from '../entities/specialty.entity';
import { CreateSpecialtyDto } from '../dtos/specialties/create-specialty.dto';
import { UpdateSpecialtyDto } from '../dtos/specialties/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
    constructor(
        @InjectRepository(Specialty)
        private readonly specialtyRepository: Repository<Specialty>,
    ) {}

    /**
     * Crea una nueva especialidad médica
     * @param createSpecialtyDto - Datos de la especialidad a crear
     * @returns La especialidad creada
     * @throws ConflictException si el nombre de la especialidad ya existe
     */
    async create(createSpecialtyDto: CreateSpecialtyDto): Promise<Specialty> {
        // Verificar que el nombre de la especialidad no exista
        const existingSpecialty = await this.specialtyRepository.findOne({
        where: { name: createSpecialtyDto.name }
        });

        if (existingSpecialty) {
        throw new ConflictException(
            `La especialidad "${createSpecialtyDto.name}" ya existe`
        );
        }

        // Crear la especialidad
        const specialty = this.specialtyRepository.create(createSpecialtyDto);
        return await this.specialtyRepository.save(specialty);
    }

    /**
     * Obtiene todas las especialidades
     * @param includeInactive - Si true, incluye especialidades con 0 doctores
     * @returns Lista de especialidades ordenadas alfabéticamente
     */
    async findAll(includeInactive: boolean = true): Promise<Specialty[]> {
        const query = this.specialtyRepository
        .createQueryBuilder('specialty')
        .leftJoinAndSelect('specialty.doctors', 'doctors')
        .orderBy('specialty.name', 'ASC');

        // Si no se incluyen inactivas, filtrar solo las que tienen doctores activos
        if (!includeInactive) {
        query.where('doctors.isAvailable = :available', { available: true });
        }

        return await query.getMany();
    }

    /**
     * Obtiene una especialidad por su ID
     * @param id - ID de la especialidad
     * @returns La especialidad encontrada con sus doctores
     * @throws NotFoundException si la especialidad no existe
     */
    async findById(id: string): Promise<Specialty> {
        const specialty = await this.specialtyRepository.findOne({
        where: { id },
        relations: ['doctors', 'doctors.user']
        });

        if (!specialty) {
        throw new NotFoundException(`Especialidad con ID ${id} no encontrada`);
        }

        return specialty;
    }

    /**
     * Obtiene una especialidad por su nombre
     * @param name - Nombre de la especialidad
     * @returns La especialidad encontrada
     * @throws NotFoundException si la especialidad no existe
     */
    async findByName(name: string): Promise<Specialty> {
        const specialty = await this.specialtyRepository.findOne({
        where: { name },
        relations: ['doctors']
        });

        if (!specialty) {
        throw new NotFoundException(`Especialidad "${name}" no encontrada`);
        }

        return specialty;
    }

    /**
     * Busca especialidades por nombre (búsqueda parcial)
     * @param searchTerm - Término de búsqueda
     * @returns Lista de especialidades que coinciden
     */
    async search(searchTerm: string): Promise<Specialty[]> {
        return await this.specialtyRepository.find({
        where: [
            { name: Like(`%${searchTerm}%`) },
            { description: Like(`%${searchTerm}%`) }
        ],
        relations: ['doctors'],
        order: { name: 'ASC' }
        });
    }

    /**
     * Obtiene especialidades con doctores disponibles
     * @returns Lista de especialidades que tienen al menos un doctor disponible
     */
    async findWithAvailableDoctors(): Promise<Specialty[]> {
        return await this.specialtyRepository
        .createQueryBuilder('specialty')
        .leftJoinAndSelect('specialty.doctors', 'doctors')
        .leftJoinAndSelect('doctors.user', 'user')
        .where('doctors.isAvailable = :available', { available: true })
        .andWhere('user.isActive = :active', { active: true })
        .orderBy('specialty.name', 'ASC')
        .getMany();
    }

    /**
     * Actualiza una especialidad
     * @param id - ID de la especialidad a actualizar
     * @param updateSpecialtyDto - Datos a actualizar
     * @returns La especialidad actualizada
     * @throws NotFoundException si la especialidad no existe
     * @throws ConflictException si el nuevo nombre ya existe
     */
    async update(id: string, updateSpecialtyDto: UpdateSpecialtyDto): Promise<Specialty> {
        const specialty = await this.findById(id);

        // Si se intenta cambiar el nombre, verificar que no exista
        if (updateSpecialtyDto.name && updateSpecialtyDto.name !== specialty.name) {
        const existingSpecialty = await this.specialtyRepository.findOne({
            where: { name: updateSpecialtyDto.name }
        });

        if (existingSpecialty) {
            throw new ConflictException(
            `La especialidad "${updateSpecialtyDto.name}" ya existe`
            );
        }
        }

        // Actualizar datos
        Object.assign(specialty, updateSpecialtyDto);
        return await this.specialtyRepository.save(specialty);
    }

    /**
     * Elimina una especialidad
     * @param id - ID de la especialidad a eliminar
     * @throws NotFoundException si la especialidad no existe
     * @throws BadRequestException si tiene doctores asignados
     */
    async delete(id: string): Promise<void> {
        const specialty = await this.findById(id);

        // Verificar que no tenga doctores asignados
        if (specialty.doctors && specialty.doctors.length > 0) {
        throw new BadRequestException(
            `No se puede eliminar la especialidad porque tiene ${specialty.doctors.length} doctor(es) asignado(s)`
        );
        }

        await this.specialtyRepository.remove(specialty);
    }

    /**
     * Verifica si una especialidad existe por nombre
     * @param name - Nombre de la especialidad
     * @returns true si existe, false si no
     */
    async existsByName(name: string): Promise<boolean> {
        const specialty = await this.specialtyRepository.findOne({
        where: { name }
        });
        return !!specialty;
    }

    /**
     * Cuenta el total de especialidades
     * @param onlyWithDoctors - Si true, solo cuenta especialidades con doctores
     * @returns Cantidad de especialidades
     */
    async count(onlyWithDoctors: boolean = false): Promise<number> {
        if (onlyWithDoctors) {
        const specialties = await this.specialtyRepository
            .createQueryBuilder('specialty')
            .leftJoin('specialty.doctors', 'doctors')
            .where('doctors.id IS NOT NULL')
            .getCount();
        
        return specialties;
        }

        return await this.specialtyRepository.count();
    }

    /**
     * Cuenta doctores por especialidad
     * @param specialtyId - ID de la especialidad
     * @param onlyAvailable - Si true, solo cuenta doctores disponibles
     * @returns Cantidad de doctores en la especialidad
     */
    async countDoctorsBySpecialty(
        specialtyId: string, 
        onlyAvailable: boolean = true
    ): Promise<number> {
        const specialty = await this.specialtyRepository
        .createQueryBuilder('specialty')
        .leftJoinAndSelect('specialty.doctors', 'doctors')
        .leftJoinAndSelect('doctors.user', 'user')
        .where('specialty.id = :specialtyId', { specialtyId })
        .getOne();

        if (!specialty) {
        throw new NotFoundException(`Especialidad con ID ${specialtyId} no encontrada`);
        }

        if (!specialty.doctors) {
        return 0;
        }

        if (onlyAvailable) {
        return specialty.doctors.filter(
            doctor => doctor.isAvailable && doctor.user?.isActive
        ).length;
        }

        return specialty.doctors.length;
    }

    /**
     * Obtiene estadísticas de una especialidad
     * @param id - ID de la especialidad
     * @returns Estadísticas de la especialidad
     */
    async getStatistics(id: string): Promise<any> {
        const specialty = await this.findById(id);

        const totalDoctors = specialty.doctors?.length || 0;
        const availableDoctors = specialty.doctors?.filter(
        d => d.isAvailable && d.user?.isActive
        ).length || 0;

        // Calcular precio promedio de consultas
        const prices = specialty.doctors
        ?.filter(d => d.consultationPrice)
        .map(d => Number(d.consultationPrice)) || [];
        
        const averagePrice = prices.length > 0
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : specialty.basePrice || 0;

        return {
        specialtyId: specialty.id,
        name: specialty.name,
        description: specialty.description,
        basePrice: specialty.basePrice,
        consultationDuration: specialty.consultationDuration,
        totalDoctors,
        availableDoctors,
        unavailableDoctors: totalDoctors - availableDoctors,
        averageConsultationPrice: Math.round(averagePrice * 100) / 100,
        // Estas estadísticas se completarán cuando implementes appointments
        totalAppointments: 0,
        completedAppointments: 0,
        };
    }

    /**
     * Obtiene las especialidades más populares (con más doctores)
     * @param limit - Cantidad de especialidades a retornar
     * @returns Lista de especialidades ordenadas por cantidad de doctores
     */
    async findMostPopular(limit: number = 5): Promise<Specialty[]> {
        const specialties = await this.specialtyRepository
        .createQueryBuilder('specialty')
        .leftJoinAndSelect('specialty.doctors', 'doctors')
        .leftJoinAndSelect('doctors.user', 'user')
        .where('doctors.isAvailable = :available', { available: true })
        .andWhere('user.isActive = :active', { active: true })
        .orderBy('COUNT(doctors.id)', 'DESC')
        .groupBy('specialty.id')
        .take(limit)
        .getMany();

        return specialties;
    }

    /**
     * Obtiene especialidades con sus precios ordenados
     * @param orderBy - Campo por el cual ordenar (basePrice, name)
     * @param order - Orden ascendente o descendente
     * @returns Lista de especialidades ordenadas
     */
    async findAllSorted(
        orderBy: 'basePrice' | 'name' | 'consultationDuration' = 'name',
        order: 'ASC' | 'DESC' = 'ASC'
    ): Promise<Specialty[]> {
        return await this.specialtyRepository
        .createQueryBuilder('specialty')
        .leftJoinAndSelect('specialty.doctors', 'doctors')
        .orderBy(`specialty.${orderBy}`, order)
        .getMany();
    }

    /**
     * Obtiene especialidades dentro de un rango de precios
     * @param minPrice - Precio mínimo
     * @param maxPrice - Precio máximo
     * @returns Lista de especialidades en el rango de precios
     */
    async findByPriceRange(minPrice: number, maxPrice: number): Promise<Specialty[]> {
        return await this.specialtyRepository
        .createQueryBuilder('specialty')
        .where('specialty.basePrice >= :minPrice', { minPrice })
        .andWhere('specialty.basePrice <= :maxPrice', { maxPrice })
        .orderBy('specialty.basePrice', 'ASC')
        .getMany();
    }

    /**
     * Obtiene la especialidad con más doctores disponibles
     * @returns La especialidad más popular
     */
    async findMostDoctorsAvailable(): Promise<Specialty | null> {
        const specialty = await this.specialtyRepository
        .createQueryBuilder('specialty')
        .leftJoinAndSelect('specialty.doctors', 'doctors')
        .leftJoinAndSelect('doctors.user', 'user')
        .where('doctors.isAvailable = :available', { available: true })
        .andWhere('user.isActive = :active', { active: true })
        .groupBy('specialty.id')
        .orderBy('COUNT(doctors.id)', 'DESC')
        .getOne();

        return specialty;
    }
}