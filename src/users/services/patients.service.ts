import { 
    Injectable, 
    NotFoundException, 
    ConflictException,
    BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from '../dtos/patients/create-patient.dto';
import { UpdatePatientDto } from '../dtos/patients/update-patient.dto';
import { PatientQueryDto } from '../dtos/patients/patient-query.dto';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';

@Injectable()
export class PatientsService {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        private readonly usersService: UsersService,
        private readonly rolesService: RolesService,
    ) {}

    /**
     * Crea un nuevo paciente
     * @param createPatientDto - Datos del paciente a crear
     * @returns El paciente creado
     */
    async create(createPatientDto: CreatePatientDto): Promise<Patient> {
        // Obtener el ID del rol PATIENT
        const patientRole = await this.rolesService.findByName('PATIENT');

        // Crear el usuario base primero
        const user = await this.usersService.create({
        ...createPatientDto.user,
        roleId: patientRole.id,
        });

        // Crear el perfil de paciente
        const patient = this.patientRepository.create({
        userId: user.id,
        emergencyContactName: createPatientDto.emergencyContactName,
        emergencyContactPhone: createPatientDto.emergencyContactPhone,
        insuranceProvider: createPatientDto.insuranceProvider,
        insuranceNumber: createPatientDto.insuranceNumber,
        bloodType: createPatientDto.bloodType,
        });

        

        return await this.patientRepository.save(patient);
    }

    /**
     * Obtiene todos los pacientes con filtros opcionales
     * @param query - Parámetros de filtrado y paginación
     * @returns Lista de pacientes y total de registros
     */
    async findAll(query: PatientQueryDto): Promise<[Patient[], number]> {
        const qb = this.patientRepository
        .createQueryBuilder('patient')
        .leftJoinAndSelect('patient.user', 'user')
        .leftJoinAndSelect('user.role', 'role');

        // Búsqueda por nombre
        if (query.search) {
        qb.andWhere(
            '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
            { search: `%${query.search}%` }
        );
        }

        // Filtro por tipo de sangre
        if (query.bloodType) {
        qb.andWhere('patient.bloodType = :bloodType', { 
            bloodType: query.bloodType 
        });
        }

        // Filtro por usuario activo
        if (query.isActive !== undefined) {
        qb.andWhere('user.isActive = :isActive', { 
            isActive: query.isActive 
        });
        }

        // Ordenamiento
        if (query.sortBy) {
        const sortField = query.sortBy === 'createdAt'
            ? 'patient.createdAt'
            : `user.${query.sortBy}`;
        
        qb.orderBy(sortField, query.order || 'DESC');
        } else {
        qb.orderBy('patient.createdAt', 'DESC');
        }

        // Paginación
        const page = query.page || 1;
        const limit = query.limit || 10;
        qb.skip((page - 1) * limit).take(limit);

        return await qb.getManyAndCount();
    }

    /**
     * Obtiene un paciente por su ID
     * @param id - ID del paciente
     * @returns El paciente encontrado
     * @throws NotFoundException si el paciente no existe
     */
    async findById(id: string): Promise<Patient> {
        const patient = await this.patientRepository.findOne({
        where: { id },
        relations: [
            'user', 
            'user.role', 
            'appointments', 
            'appointments.doctor',
            'appointments.doctor.user',
            'medicalRecords',
            'consultations'
        ]
        });

        if (!patient) {
        throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
        }

        return patient;
    }

    /**
     * Obtiene un paciente por el ID del usuario
     * @param userId - ID del usuario
     * @returns El paciente encontrado
     * @throws NotFoundException si el paciente no existe
     */
    async findByUserId(userId: string): Promise<Patient> {
        const patient = await this.patientRepository.findOne({
        where: { userId },
        relations: ['user', 'user.role']
        });

        if (!patient) {
        throw new NotFoundException(`Paciente con userId ${userId} no encontrado`);
        }

        return patient;
    }

    /**
     * Busca pacientes por nombre o email
     * @param searchTerm - Término de búsqueda
     * @returns Lista de pacientes que coinciden
     */
    async search(searchTerm: string): Promise<Patient[]> {
        return await this.patientRepository
        .createQueryBuilder('patient')
        .leftJoinAndSelect('patient.user', 'user')
        .where(
            'user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search',
            { search: `%${searchTerm}%` }
        )
        .andWhere('user.isActive = :active', { active: true })
        .orderBy('user.firstName', 'ASC')
        .getMany();
    }

    /**
     * Obtiene pacientes por tipo de sangre
     * @param bloodType - Tipo de sangre
     * @returns Lista de pacientes con ese tipo de sangre
     */
    async findByBloodType(bloodType: string): Promise<Patient[]> {
        return await this.patientRepository.find({
        where: { 
            bloodType,
            user: { isActive: true }
        },
        relations: ['user'],
        order: { createdAt: 'DESC' }
        });
    }

    /**
     * Obtiene pacientes activos
     * @returns Lista de pacientes activos
     */
    async findActive(): Promise<Patient[]> {
        return await this.patientRepository.find({
        where: { 
            user: { isActive: true }
        },
        relations: ['user'],
        order: { createdAt: 'DESC' }
        });
    }

    /**
     * Obtiene pacientes con seguro médico
     * @param provider - Proveedor de seguro (opcional)
     * @returns Lista de pacientes con seguro
     */
    async findWithInsurance(provider?: string): Promise<Patient[]> {
        const qb = this.patientRepository
        .createQueryBuilder('patient')
        .leftJoinAndSelect('patient.user', 'user')
        .where('patient.insuranceProvider IS NOT NULL')
        .andWhere('patient.insuranceNumber IS NOT NULL')
        .andWhere('user.isActive = :active', { active: true });

        if (provider) {
        qb.andWhere('patient.insuranceProvider ILIKE :provider', {
            provider: `%${provider}%`
        });
        }

        return await qb.getMany();
    }

    /**
     * Actualiza un paciente
     * @param id - ID del paciente a actualizar
     * @param updatePatientDto - Datos a actualizar
     * @returns El paciente actualizado
     * @throws NotFoundException si el paciente no existe
     */
    async update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
        const patient = await this.findById(id);

        // Si hay datos del usuario, actualizarlos
        if (updatePatientDto.user) {
        await this.usersService.update(patient.userId, updatePatientDto.user);
        }

        // Actualizar datos del paciente
        const { user, ...patientData } = updatePatientDto;
        Object.assign(patient, patientData);

        return await this.patientRepository.save(patient);
    }

    /**
     * Desactiva un paciente (desactiva su usuario)
     * @param id - ID del paciente
     * @returns El paciente desactivado
     */
    async deactivate(id: string): Promise<Patient> {
        const patient = await this.findById(id);
        
        // Desactivar el usuario
        await this.usersService.deactivate(patient.userId);
        
        return await this.findById(id);
    }

    /**
     * Activa un paciente (activa su usuario)
     * @param id - ID del paciente
     * @returns El paciente activado
     */
    async activate(id: string): Promise<Patient> {
        const patient = await this.findById(id);
        
        // Activar el usuario
        await this.usersService.activate(patient.userId);
        
        return await this.findById(id);
    }

    /**
     * Elimina un paciente permanentemente
     * @param id - ID del paciente a eliminar
     * @throws BadRequestException si tiene citas activas
     */
    async delete(id: string): Promise<void> {
        const patient = await this.findById(id);

        // Verificar que no tenga citas futuras
        // Esta validación se debe implementar cuando tengas el módulo de appointments
        // const futureAppointments = await this.appointmentsService.countFutureByPatient(id);
        // if (futureAppointments > 0) {
        //   throw new BadRequestException('No se puede eliminar el paciente porque tiene citas programadas');
        // }

        // Eliminar el paciente (esto también eliminará el usuario por CASCADE)
        await this.patientRepository.remove(patient);
    }

    /**
     * Cuenta el total de pacientes
     * @param onlyActive - Si true, solo cuenta pacientes activos
     * @returns Cantidad de pacientes
     */
    async count(onlyActive: boolean = false): Promise<number> {
        if (onlyActive) {
        return await this.patientRepository.count({
            where: { user: { isActive: true } }
        });
        }

        return await this.patientRepository.count();
    }

    /**
     * Cuenta pacientes por tipo de sangre
     * @param bloodType - Tipo de sangre
     * @returns Cantidad de pacientes con ese tipo de sangre
     */
    async countByBloodType(bloodType: string): Promise<number> {
        return await this.patientRepository.count({
        where: { 
            bloodType,
            user: { isActive: true }
        }
        });
    }

    /**
     * Cuenta pacientes con seguro médico
     * @returns Cantidad de pacientes con seguro
     */
    async countWithInsurance(): Promise<number> {
        return await this.patientRepository
        .createQueryBuilder('patient')
        .leftJoin('patient.user', 'user')
        .where('patient.insuranceProvider IS NOT NULL')
        .andWhere('patient.insuranceNumber IS NOT NULL')
        .andWhere('user.isActive = :active', { active: true })
        .getCount();
    }

    /**
     * Obtiene estadísticas de un paciente
     * @param id - ID del paciente
     * @returns Estadísticas del paciente
     */
    async getStatistics(id: string): Promise<any> {
        const patient = await this.findById(id);

        // Estas estadísticas se completarán cuando implementes appointments
        const totalAppointments = patient.appointments?.length || 0;
        const completedAppointments = patient.appointments?.filter(
        a => a.status === 'COMPLETED'
        ).length || 0;
        const cancelledAppointments = patient.appointments?.filter(
        a => a.status === 'CANCELLED'
        ).length || 0;
        const upcomingAppointments = patient.appointments?.filter(
        a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
        ).length || 0;

        return {
        patientId: patient.id,
        name: `${patient.user.firstName} ${patient.user.lastName}`,
        email: patient.user.email,
        bloodType: patient.bloodType,
        hasInsurance: !!(patient.insuranceProvider && patient.insuranceNumber),
        insuranceProvider: patient.insuranceProvider,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        upcomingAppointments,
        totalMedicalRecords: patient.medicalRecords?.length || 0,
        totalConsultations: patient.consultations?.length || 0,
        registeredAt: patient.createdAt,
        lastAppointment: patient.appointments?.[0]?.appointmentDate || null,
        };
    }

    /**
     * Obtiene pacientes recientes (últimos registrados)
     * @param limit - Cantidad de pacientes a retornar
     * @returns Lista de pacientes recientes
     */
    async findRecent(limit: number = 10): Promise<Patient[]> {
        return await this.patientRepository.find({
        where: { user: { isActive: true } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: limit
        });
    }

    /**
     * Obtiene pacientes con más citas
     * @param limit - Cantidad de pacientes a retornar
     * @returns Lista de pacientes ordenados por cantidad de citas
     */
    async findMostAppointments(limit: number = 10): Promise<Patient[]> {
        // Esta implementación se completará cuando tengas el módulo de appointments
        return await this.patientRepository.find({
        where: { user: { isActive: true } },
        relations: ['user', 'appointments'],
        order: { createdAt: 'DESC' },
        take: limit
        });
    }

    /**
     * Obtiene distribución de tipos de sangre
     * @returns Estadísticas de tipos de sangre
     */
    async getBloodTypeDistribution(): Promise<any[]> {
        const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        
        const distribution = await Promise.all(
        bloodTypes.map(async (bloodType) => ({
            bloodType,
            count: await this.countByBloodType(bloodType)
        }))
        );

        return distribution.filter(d => d.count > 0);
    }

    /**
     * Obtiene estadísticas generales de pacientes
     * @returns Estadísticas generales
     */
    async getGeneralStatistics(): Promise<any> {
        const total = await this.count();
        const active = await this.count(true);
        const withInsurance = await this.countWithInsurance();
        const bloodTypeDistribution = await this.getBloodTypeDistribution();

        return {
        total,
        active,
        inactive: total - active,
        withInsurance,
        withoutInsurance: active - withInsurance,
        bloodTypeDistribution,
        // Estas estadísticas se completarán con appointments
        totalAppointments: 0,
        averageAppointmentsPerPatient: 0,
        };
    }

    /**
     * Actualiza información de emergencia
     * @param id - ID del paciente
     * @param emergencyContactName - Nombre del contacto de emergencia
     * @param emergencyContactPhone - Teléfono del contacto de emergencia
     * @returns El paciente actualizado
     */
    async updateEmergencyContact(
        id: string,
        emergencyContactName: string,
        emergencyContactPhone: string
    ): Promise<Patient> {
        const patient = await this.findById(id);
        
        patient.emergencyContactName = emergencyContactName;
        patient.emergencyContactPhone = emergencyContactPhone;
        
        return await this.patientRepository.save(patient);
    }

    /**
     * Actualiza información de seguro médico
     * @param id - ID del paciente
     * @param insuranceProvider - Proveedor de seguro
     * @param insuranceNumber - Número de póliza
     * @returns El paciente actualizado
     */
    async updateInsurance(
        id: string,
        insuranceProvider: string,
        insuranceNumber: string
    ): Promise<Patient> {
        const patient = await this.findById(id);
        
        patient.insuranceProvider = insuranceProvider;
        patient.insuranceNumber = insuranceNumber;
        
        return await this.patientRepository.save(patient);
    }

    /**
     * Actualiza tipo de sangre
     * @param id - ID del paciente
     * @param bloodType - Tipo de sangre
     * @returns El paciente actualizado
     */
    async updateBloodType(id: string, bloodType: string): Promise<Patient> {
        const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        
        if (!validBloodTypes.includes(bloodType)) {
        throw new BadRequestException(
            `Tipo de sangre inválido. Debe ser uno de: ${validBloodTypes.join(', ')}`
        );
        }

        const patient = await this.findById(id);
        patient.bloodType = bloodType;
        
        return await this.patientRepository.save(patient);
    }

    /**
     * Verifica si un paciente tiene seguro médico
     * @param id - ID del paciente
     * @returns true si tiene seguro, false si no
     */
    async hasInsurance(id: string): Promise<boolean> {
        const patient = await this.findById(id);
        return !!(patient.insuranceProvider && patient.insuranceNumber);
    }

    /**
     * Obtiene el historial completo del paciente
     * @param id - ID del paciente
     * @returns Historial completo (citas, consultas, registros médicos)
     */
    async getFullHistory(id: string): Promise<any> {
        const patient = await this.findById(id);

        return {
        patient: {
            id: patient.id,
            name: `${patient.user.firstName} ${patient.user.lastName}`,
            email: patient.user.email,
            phone: patient.user.phone,
            dateOfBirth: patient.user.dateOfBirth,
            bloodType: patient.bloodType,
            emergencyContact: {
            name: patient.emergencyContactName,
            phone: patient.emergencyContactPhone,
            },
            insurance: {
            provider: patient.insuranceProvider,
            number: patient.insuranceNumber,
            },
        },
        appointments: patient.appointments || [],
        consultations: patient.consultations || [],
        medicalRecords: patient.medicalRecords || [],
        };
    }
}