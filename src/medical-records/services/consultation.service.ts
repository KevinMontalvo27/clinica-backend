import { 
    Injectable, 
    NotFoundException, 
    BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Not, IsNull } from 'typeorm';
import { Consultation } from '../entities/consultation.entity';
import { CreateConsultationDto } from '../dtos/create-consultation.dto';
import { UpdateConsultationDto } from '../dtos/update-consultation.dto';
import { ConsultationQueryDto } from '../dtos/consultation-query.dto';

@Injectable()
export class ConsultationsService {
    constructor(
        @InjectRepository(Consultation)
        private readonly consultationRepository: Repository<Consultation>,
    ) {}

    /**
     * Crea una nueva consulta médica
     * @param createConsultationDto - Datos de la consulta
     * @returns La consulta creada
     */
    async create(createConsultationDto: CreateConsultationDto): Promise<Consultation> {
        // Validar que la presión arterial sea coherente
        if (createConsultationDto.bloodPressureSystolic && 
            createConsultationDto.bloodPressureDiastolic) {
            if (createConsultationDto.bloodPressureSystolic <= 
                createConsultationDto.bloodPressureDiastolic) {
                throw new BadRequestException(
                    'La presión sistólica debe ser mayor que la diastólica'
                );
            }
        }

        const consultation = this.consultationRepository.create({
            ...createConsultationDto,
            consultationDate: new Date(),
        });
        
        return await this.consultationRepository.save(consultation);
    }

    
    /**
     * Obtiene todas las consultas con filtros
     * @param query - Parámetros de filtrado y paginación
     * @returns Lista de consultas y total de registros
     */
    async findAll(query: ConsultationQueryDto): Promise<[Consultation[], number]> {
        const qb = this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .leftJoinAndSelect('consultation.doctor', 'doctor')
            .leftJoinAndSelect('doctor.user', 'doctorUser')
            .leftJoinAndSelect('doctor.specialty', 'specialty')
            .leftJoinAndSelect('consultation.appointment', 'appointment');

        // Filtros
        if (query.patientId) {
            qb.andWhere('consultation.patientId = :patientId', { 
                patientId: query.patientId 
            });
        }

        if (query.doctorId) {
            qb.andWhere('consultation.doctorId = :doctorId', { 
                doctorId: query.doctorId 
            });
        }

        if (query.appointmentId) {
            qb.andWhere('consultation.appointmentId = :appointmentId', { 
                appointmentId: query.appointmentId 
            });
        }

        // Filtro por rango de fechas
        if (query.startDate && query.endDate) {
            qb.andWhere('consultation.consultationDate BETWEEN :startDate AND :endDate', {
                startDate: query.startDate,
                endDate: query.endDate
            });
        } else if (query.startDate) {
            qb.andWhere('consultation.consultationDate >= :startDate', { 
                startDate: query.startDate 
            });
        } else if (query.endDate) {
            qb.andWhere('consultation.consultationDate <= :endDate', { 
                endDate: query.endDate 
            });
        }

        // Búsqueda por diagnóstico
        if (query.diagnosisSearch) {
            qb.andWhere('consultation.diagnosis ILIKE :diagnosis', { 
                diagnosis: `%${query.diagnosisSearch}%` 
            });
        }

        // Ordenamiento
        if (query.sortBy) {
            qb.orderBy(`consultation.${query.sortBy}`, query.order || 'DESC');
        } else {
            qb.orderBy('consultation.consultationDate', 'DESC');
        }

        // Paginación
        const page = query.page || 1;
        const limit = query.limit || 10;
        qb.skip((page - 1) * limit).take(limit);

        return await qb.getManyAndCount();
    }

    /**
     * Obtiene una consulta por su ID
     * @param id - ID de la consulta
     * @returns La consulta encontrada
     * @throws NotFoundException si no existe
     */
    async findById(id: string): Promise<Consultation> {
        const consultation = await this.consultationRepository.findOne({
            where: { id },
            relations: [
                'patient',
                'patient.user',
                'doctor',
                'doctor.user',
                'doctor.specialty',
                'appointment'
            ]
        });

        if (!consultation) {
            throw new NotFoundException(`Consulta con ID ${id} no encontrada`);
        }

        return consultation;
    }

    /**
     * Obtiene consultas por paciente
     * @param patientId - ID del paciente
     * @param startDate - Fecha de inicio (opcional)
     * @param endDate - Fecha de fin (opcional)
     * @returns Lista de consultas del paciente
     */
    async findByPatient(
        patientId: string,
        startDate?: string,
        endDate?: string
    ): Promise<Consultation[]> {
        const qb = this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.doctor', 'doctor')
            .leftJoinAndSelect('doctor.user', 'doctorUser')
            .leftJoinAndSelect('doctor.specialty', 'specialty')
            .where('consultation.patientId = :patientId', { patientId });

        if (startDate && endDate) {
            qb.andWhere('consultation.consultationDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            });
        } else if (startDate) {
            qb.andWhere('consultation.consultationDate >= :startDate', { startDate });
        } else if (endDate) {
            qb.andWhere('consultation.consultationDate <= :endDate', { endDate });
        }

        qb.orderBy('consultation.consultationDate', 'DESC');

        return await qb.getMany();
    }

    /**
     * Obtiene consultas por doctor
     * @param doctorId - ID del doctor
     * @param startDate - Fecha de inicio (opcional)
     * @param endDate - Fecha de fin (opcional)
     * @returns Lista de consultas del doctor
     */
    async findByDoctor(
        doctorId: string,
        startDate?: string,
        endDate?: string
    ): Promise<Consultation[]> {
        const qb = this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .where('consultation.doctorId = :doctorId', { doctorId });

        if (startDate && endDate) {
            qb.andWhere('consultation.consultationDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            });
        } else if (startDate) {
            qb.andWhere('consultation.consultationDate >= :startDate', { startDate });
        } else if (endDate) {
            qb.andWhere('consultation.consultationDate <= :endDate', { endDate });
        }

        qb.orderBy('consultation.consultationDate', 'DESC');

        return await qb.getMany();
    }

    /**
     * Obtiene la última consulta de un paciente
     * @param patientId - ID del paciente
     * @returns La última consulta o null
     */
    async findLastByPatient(patientId: string): Promise<Consultation | null> {
        return await this.consultationRepository.findOne({
            where: { patientId },
            relations: ['doctor', 'doctor.user', 'doctor.specialty'],
            order: { consultationDate: 'DESC' }
        });
    }

    /**
     * Obtiene consultas recientes (últimos 30 días)
     * @param limit - Cantidad de resultados
     * @returns Lista de consultas recientes
     */
    async findRecent(limit: number = 10): Promise<Consultation[]> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return await this.consultationRepository.find({
            where: {
                consultationDate: MoreThanOrEqual(thirtyDaysAgo)
            },
            relations: [
                'patient',
                'patient.user',
                'doctor',
                'doctor.user',
                'doctor.specialty'
            ],
            order: { consultationDate: 'DESC' },
            take: limit
        });
    }

    /**
     * Busca consultas por diagnóstico
     * @param searchTerm - Término de búsqueda
     * @returns Lista de consultas con ese diagnóstico
     */
    async searchByDiagnosis(searchTerm: string): Promise<Consultation[]> {
        return await this.consultationRepository
            .createQueryBuilder('consultation')
            .leftJoinAndSelect('consultation.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .leftJoinAndSelect('consultation.doctor', 'doctor')
            .leftJoinAndSelect('doctor.user', 'doctorUser')
            .where('consultation.diagnosis ILIKE :search', { 
                search: `%${searchTerm}%` 
            })
            .orderBy('consultation.consultationDate', 'DESC')
            .getMany();
    }

    /**
     * Actualiza una consulta
     * @param id - ID de la consulta
     * @param updateConsultationDto - Datos a actualizar
     * @returns La consulta actualizada
     */
    async update(
        id: string,
        updateConsultationDto: UpdateConsultationDto
    ): Promise<Consultation> {
        const consultation = await this.findById(id);

        // Validar presión arterial si se actualiza
        if (updateConsultationDto.bloodPressureSystolic && 
            updateConsultationDto.bloodPressureDiastolic) {
            if (updateConsultationDto.bloodPressureSystolic <= 
                updateConsultationDto.bloodPressureDiastolic) {
                throw new BadRequestException(
                    'La presión sistólica debe ser mayor que la diastólica'
                );
            }
        }

        Object.assign(consultation, updateConsultationDto);
        return await this.consultationRepository.save(consultation);
    }

    /**
     * Elimina una consulta
     * @param id - ID de la consulta
     */
    async delete(id: string): Promise<void> {
        const consultation = await this.findById(id);
        await this.consultationRepository.remove(consultation);
    }

    /**
     * Cuenta consultas por paciente
     * @param patientId - ID del paciente
     * @returns Cantidad de consultas
     */
    async countByPatient(patientId: string): Promise<number> {
        return await this.consultationRepository.count({
            where: { patientId }
        });
    }

    /**
     * Cuenta consultas por doctor
     * @param doctorId - ID del doctor
     * @returns Cantidad de consultas
     */
    async countByDoctor(doctorId: string): Promise<number> {
        return await this.consultationRepository.count({
            where: { doctorId }
        });
    }

    /**
     * Obtiene estadísticas de signos vitales de un paciente
     * @param patientId - ID del paciente
     * @returns Estadísticas de signos vitales
     */
    async getVitalSignsStats(patientId: string): Promise<any> {
        const consultations = await this.consultationRepository.find({
            where: { patientId },
            order: { consultationDate: 'DESC' },
            take: 10 // Últimas 10 consultas
        });

        if (consultations.length === 0) {
            return {
                patientId,
                message: 'No hay consultas registradas',
                stats: null
            };
        }

        // Calcular promedios
        const weights = consultations
            .filter(c => c.weight)
            .map(c => c.weight!);
        
        const systolicBPs = consultations
            .filter(c => c.bloodPressureSystolic)
            .map(c => c.bloodPressureSystolic!);
        
        const diastolicBPs = consultations
            .filter(c => c.bloodPressureDiastolic)
            .map(c => c.bloodPressureDiastolic!);
        
        const heartRates = consultations
            .filter(c => c.heartRate)
            .map(c => c.heartRate!);

        const calculateAverage = (arr: number[]) => 
            arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

        return {
            patientId,
            consultationsAnalyzed: consultations.length,
            averageWeight: calculateAverage(weights),
            averageBloodPressure: {
                systolic: calculateAverage(systolicBPs),
                diastolic: calculateAverage(diastolicBPs)
            },
            averageHeartRate: calculateAverage(heartRates),
            latestConsultation: consultations[0]?.consultationDate,
        };
    }

    /**
     * Obtiene consultas de hoy
     * @param doctorId - ID del doctor (opcional)
     * @returns Lista de consultas de hoy
     */
    async findToday(doctorId?: string): Promise<Consultation[]> {
        const today = new Date().toISOString().split('T')[0];
        
        const where: any = { 
            consultationDate: new Date(today) 
        };
        
        if (doctorId) {
            where.doctorId = doctorId;
        }

        return await this.consultationRepository.find({
            where,
            relations: [
                'patient',
                'patient.user',
                'doctor',
                'doctor.user'
            ],
            order: { createdAt: 'ASC' }
        });
    }

    /**
     * Obtiene estadísticas generales de consultas
     * @returns Estadísticas generales
     */
    async getGeneralStatistics(): Promise<any> {
        const total = await this.consultationRepository.count();
        
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const lastMonth = await this.consultationRepository.count({
            where: {
                consultationDate: Between(thirtyDaysAgo, today)
            }
        });

        const withDiagnosis = await this.consultationRepository
            .createQueryBuilder('consultation')
            .where('consultation.diagnosis IS NOT NULL')
            .andWhere("consultation.diagnosis != ''")
            .getCount();

        const withPrescriptions = await this.consultationRepository
            .createQueryBuilder('consultation')
            .where('consultation.prescriptions IS NOT NULL')
            .andWhere("consultation.prescriptions != ''")
            .getCount();

        return {
            total,
            lastMonth,
            withDiagnosis,
            withPrescriptions,
            averagePerDay: lastMonth / 30,
        };
    }

    /**
     * Obtiene diagnósticos más comunes
     * @param limit - Cantidad de resultados
     * @returns Lista de diagnósticos más frecuentes
     */
    async getCommonDiagnoses(limit: number = 10): Promise<any[]> {
        const consultations = await this.consultationRepository.find({
            where: {
                diagnosis: Not(IsNull())
            },
            select: ['diagnosis']
        });

        // Agrupar y contar diagnósticos
        const diagnosisCount = new Map<string, number>();
        
        consultations.forEach(c => {
            if (c.diagnosis && c.diagnosis.trim()) {
                const diagnosis = c.diagnosis.trim().toLowerCase();
                diagnosisCount.set(diagnosis, (diagnosisCount.get(diagnosis) || 0) + 1);
            }
        });

        // Convertir a array y ordenar
        return Array.from(diagnosisCount.entries())
            .map(([diagnosis, count]) => ({ diagnosis, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
}