import { 
    Injectable, 
    NotFoundException, 
    ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from '../entities/medical-record.entity';
import { CreateMedicalRecordDto } from '../dtos/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../dtos/update-medical-record.dto';
import { MedicalRecordQueryDto } from '../dtos/medical-record-query.dto';

@Injectable()
export class MedicalRecordsService {
    constructor(
        @InjectRepository(MedicalRecord)
        private readonly medicalRecordRepository: Repository<MedicalRecord>,
    ) {}

    /**
     * Crea un nuevo expediente médico
     * @param createMedicalRecordDto - Datos del expediente
     * @returns El expediente creado
     * @throws ConflictException si el paciente ya tiene un expediente
     */
    async create(createMedicalRecordDto: CreateMedicalRecordDto): Promise<MedicalRecord> {
        // Verificar que el paciente no tenga ya un expediente
        const existing = await this.medicalRecordRepository.findOne({
            where: { patientId: createMedicalRecordDto.patientId }
        });

        if (existing) {
            throw new ConflictException(
                `El paciente ya tiene un expediente médico. Use la función de actualización.`
            );
        }

        const medicalRecord = this.medicalRecordRepository.create(createMedicalRecordDto);
        return await this.medicalRecordRepository.save(medicalRecord);
    }

    /**
     * Obtiene todos los expedientes médicos con filtros
     * @param query - Parámetros de filtrado y paginación
     * @returns Lista de expedientes y total de registros
     */
    async findAll(query: MedicalRecordQueryDto): Promise<[MedicalRecord[], number]> {
        const qb = this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .leftJoinAndSelect('medicalRecord.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .leftJoinAndSelect('medicalRecord.createdBy', 'doctor')
            .leftJoinAndSelect('doctor.user', 'doctorUser')
            .leftJoinAndSelect('doctor.specialty', 'specialty');

        // Filtros
        if (query.patientId) {
            qb.andWhere('medicalRecord.patientId = :patientId', { 
                patientId: query.patientId 
            });
        }

        if (query.doctorId) {
            qb.andWhere('medicalRecord.created_by = :doctorId', { 
                doctorId: query.doctorId 
            });
        }

        // Búsqueda por alergias
        if (query.allergySearch) {
            qb.andWhere('medicalRecord.allergies ILIKE :allergy', { 
                allergy: `%${query.allergySearch}%` 
            });
        }

        // Búsqueda por enfermedades crónicas
        if (query.diseaseSearch) {
            qb.andWhere('medicalRecord.chronicDiseases ILIKE :disease', { 
                disease: `%${query.diseaseSearch}%` 
            });
        }

        // Ordenamiento
        if (query.sortBy) {
            qb.orderBy(`medicalRecord.${query.sortBy}`, query.order || 'DESC');
        } else {
            qb.orderBy('medicalRecord.updatedAt', 'DESC');
        }

        // Paginación
        const page = query.page || 1;
        const limit = query.limit || 10;
        qb.skip((page - 1) * limit).take(limit);

        return await qb.getManyAndCount();
    }

    /**
     * Obtiene un expediente por su ID
     * @param id - ID del expediente
     * @returns El expediente encontrado
     * @throws NotFoundException si no existe
     */
    async findById(id: string): Promise<MedicalRecord> {
        const medicalRecord = await this.medicalRecordRepository.findOne({
            where: { id },
            relations: [
                'patient',
                'patient.user',
                'createdBy',
                'createdBy.user',
                'createdBy.specialty'
            ]
        });

        if (!medicalRecord) {
            throw new NotFoundException(`Expediente médico con ID ${id} no encontrado`);
        }

        return medicalRecord;
    }

    /**
     * Obtiene el expediente de un paciente
     * @param patientId - ID del paciente
     * @returns El expediente del paciente
     * @throws NotFoundException si no existe
     */
    async findByPatient(patientId: string): Promise<MedicalRecord> {
        const medicalRecord = await this.medicalRecordRepository.findOne({
            where: { patientId },
            relations: [
                'patient',
                'patient.user',
                'createdBy',
                'createdBy.user',
                'createdBy.specialty'
            ]
        });

        if (!medicalRecord) {
            throw new NotFoundException(
                `No se encontró expediente médico para el paciente con ID ${patientId}`
            );
        }

        return medicalRecord;
    }

    /**
     * Obtiene expedientes creados por un doctor
     * @param doctorId - ID del doctor
     * @returns Lista de expedientes creados por el doctor
     */
    async findByDoctor(doctorId: string): Promise<MedicalRecord[]> {
        return await this.medicalRecordRepository.find({
            where: { created_by: doctorId },
            relations: [
                'patient',
                'patient.user'
            ],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Busca expedientes por alergias
     * @param allergySearch - Término de búsqueda
     * @returns Lista de expedientes con esa alergia
     */
    async searchByAllergy(allergySearch: string): Promise<MedicalRecord[]> {
        return await this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .leftJoinAndSelect('medicalRecord.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .where('medicalRecord.allergies ILIKE :search', { 
                search: `%${allergySearch}%` 
            })
            .orderBy('patientUser.lastName', 'ASC')
            .getMany();
    }

    /**
     * Busca expedientes por enfermedad crónica
     * @param diseaseSearch - Término de búsqueda
     * @returns Lista de expedientes con esa enfermedad
     */
    async searchByChronicDisease(diseaseSearch: string): Promise<MedicalRecord[]> {
        return await this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .leftJoinAndSelect('medicalRecord.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .where('medicalRecord.chronicDiseases ILIKE :search', { 
                search: `%${diseaseSearch}%` 
            })
            .orderBy('patientUser.lastName', 'ASC')
            .getMany();
    }

    /**
     * Obtiene expedientes con alergias registradas
     * @returns Lista de expedientes con alergias
     */
    async findWithAllergies(): Promise<MedicalRecord[]> {
        return await this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .leftJoinAndSelect('medicalRecord.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .where('medicalRecord.allergies IS NOT NULL')
            .andWhere("medicalRecord.allergies != ''")
            .orderBy('patientUser.lastName', 'ASC')
            .getMany();
    }

    /**
     * Obtiene expedientes con enfermedades crónicas
     * @returns Lista de expedientes con enfermedades crónicas
     */
    async findWithChronicDiseases(): Promise<MedicalRecord[]> {
        return await this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .leftJoinAndSelect('medicalRecord.patient', 'patient')
            .leftJoinAndSelect('patient.user', 'patientUser')
            .where('medicalRecord.chronicDiseases IS NOT NULL')
            .andWhere("medicalRecord.chronicDiseases != ''")
            .orderBy('patientUser.lastName', 'ASC')
            .getMany();
    }

    /**
     * Actualiza un expediente médico
     * @param id - ID del expediente
     * @param updateMedicalRecordDto - Datos a actualizar
     * @returns El expediente actualizado
     */
    async update(
        id: string,
        updateMedicalRecordDto: UpdateMedicalRecordDto
    ): Promise<MedicalRecord> {
        const medicalRecord = await this.findById(id);

        Object.assign(medicalRecord, updateMedicalRecordDto);
        return await this.medicalRecordRepository.save(medicalRecord);
    }

    /**
     * Actualiza el expediente por ID de paciente
     * @param patientId - ID del paciente
     * @param updateMedicalRecordDto - Datos a actualizar
     * @returns El expediente actualizado
     */
    async updateByPatient(
        patientId: string,
        updateMedicalRecordDto: UpdateMedicalRecordDto
    ): Promise<MedicalRecord> {
        const medicalRecord = await this.findByPatient(patientId);

        Object.assign(medicalRecord, updateMedicalRecordDto);
        return await this.medicalRecordRepository.save(medicalRecord);
    }

    /**
     * Añade información al historial médico
     * @param id - ID del expediente
     * @param additionalHistory - Información adicional
     * @returns El expediente actualizado
     */
    async appendMedicalHistory(
        id: string,
        additionalHistory: string
    ): Promise<MedicalRecord> {
        const medicalRecord = await this.findById(id);

        const currentHistory = medicalRecord.medicalHistory || '';
        const separator = currentHistory ? '\n---\n' : '';
        
        medicalRecord.medicalHistory = 
            `${currentHistory}${separator}${new Date().toLocaleDateString()}: ${additionalHistory}`;

        return await this.medicalRecordRepository.save(medicalRecord);
    }

    /**
     * Añade una alergia al expediente
     * @param id - ID del expediente
     * @param allergy - Nueva alergia
     * @returns El expediente actualizado
     */
    async addAllergy(id: string, allergy: string): Promise<MedicalRecord> {
        const medicalRecord = await this.findById(id);

        const currentAllergies = medicalRecord.allergies || '';
        const separator = currentAllergies ? ', ' : '';
        
        // Verificar que no esté duplicada
        if (currentAllergies.toLowerCase().includes(allergy.toLowerCase())) {
            return medicalRecord;
        }

        medicalRecord.allergies = `${currentAllergies}${separator}${allergy}`;

        return await this.medicalRecordRepository.save(medicalRecord);
    }

    /**
     * Añade una enfermedad crónica al expediente
     * @param id - ID del expediente
     * @param disease - Nueva enfermedad
     * @returns El expediente actualizado
     */
    async addChronicDisease(id: string, disease: string): Promise<MedicalRecord> {
        const medicalRecord = await this.findById(id);

        const currentDiseases = medicalRecord.chronicDiseases || '';
        const separator = currentDiseases ? ', ' : '';
        
        // Verificar que no esté duplicada
        if (currentDiseases.toLowerCase().includes(disease.toLowerCase())) {
            return medicalRecord;
        }

        medicalRecord.chronicDiseases = `${currentDiseases}${separator}${disease}`;

        return await this.medicalRecordRepository.save(medicalRecord);
    }

    /**
     * Actualiza medicamentos actuales
     * @param id - ID del expediente
     * @param medications - Medicamentos actualizados
     * @returns El expediente actualizado
     */
    async updateCurrentMedications(
        id: string,
        medications: string
    ): Promise<MedicalRecord> {
        const medicalRecord = await this.findById(id);
        medicalRecord.currentMedications = medications;
        return await this.medicalRecordRepository.save(medicalRecord);
    }

    /**
     * Elimina un expediente médico
     * @param id - ID del expediente
     */
    async delete(id: string): Promise<void> {
        const medicalRecord = await this.findById(id);
        await this.medicalRecordRepository.remove(medicalRecord);
    }

    /**
     * Verifica si un paciente tiene expediente médico
     * @param patientId - ID del paciente
     * @returns true si tiene expediente, false si no
     */
    async hasRecord(patientId: string): Promise<boolean> {
        const count = await this.medicalRecordRepository.count({
            where: { patientId }
        });
        return count > 0;
    }

    /**
     * Cuenta expedientes totales
     * @returns Cantidad de expedientes
     */
    async count(): Promise<number> {
        return await this.medicalRecordRepository.count();
    }

    /**
     * Cuenta expedientes por doctor
     * @param doctorId - ID del doctor
     * @returns Cantidad de expedientes creados por el doctor
     */
    async countByDoctor(doctorId: string): Promise<number> {
        return await this.medicalRecordRepository.count({
            where: { created_by: doctorId }
        });
    }

    /**
     * Obtiene estadísticas generales
     * @returns Estadísticas de expedientes
     */
    async getGeneralStatistics(): Promise<any> {
        const total = await this.count();
        
        const withAllergies = await this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .where('medicalRecord.allergies IS NOT NULL')
            .andWhere("medicalRecord.allergies != ''")
            .getCount();

        const withChronicDiseases = await this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .where('medicalRecord.chronicDiseases IS NOT NULL')
            .andWhere("medicalRecord.chronicDiseases != ''")
            .getCount();

        const withCurrentMedications = await this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .where('medicalRecord.currentMedications IS NOT NULL')
            .andWhere("medicalRecord.currentMedications != ''")
            .getCount();

        const withFamilyHistory = await this.medicalRecordRepository
            .createQueryBuilder('medicalRecord')
            .where('medicalRecord.familyHistory IS NOT NULL')
            .andWhere("medicalRecord.familyHistory != ''")
            .getCount();

        return {
            total,
            withAllergies,
            withChronicDiseases,
            withCurrentMedications,
            withFamilyHistory,
            percentageWithAllergies: total > 0 ? ((withAllergies / total) * 100).toFixed(2) : 0,
            percentageWithChronicDiseases: total > 0 ? ((withChronicDiseases / total) * 100).toFixed(2) : 0,
        };
    }

    /**
     * Obtiene las alergias más comunes
     * @param limit - Cantidad de resultados
     * @returns Lista de alergias más frecuentes
     */
    async getCommonAllergies(limit: number = 10): Promise<any[]> {
        const records = await this.medicalRecordRepository.find({
            where: {},
            select: ['allergies']
        });

        const allergyCount = new Map<string, number>();
        
        records.forEach(record => {
            if (record.allergies && record.allergies.trim()) {
                const allergies = record.allergies
                    .split(',')
                    .map(a => a.trim().toLowerCase())
                    .filter(a => a);

                allergies.forEach(allergy => {
                    allergyCount.set(allergy, (allergyCount.get(allergy) || 0) + 1);
                });
            }
        });

        return Array.from(allergyCount.entries())
            .map(([allergy, count]) => ({ allergy, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Obtiene las enfermedades crónicas más comunes
     * @param limit - Cantidad de resultados
     * @returns Lista de enfermedades más frecuentes
     */
    async getCommonChronicDiseases(limit: number = 10): Promise<any[]> {
        const records = await this.medicalRecordRepository.find({
            where: {},
            select: ['chronicDiseases']
        });

        const diseaseCount = new Map<string, number>();
        
        records.forEach(record => {
            if (record.chronicDiseases && record.chronicDiseases.trim()) {
                const diseases = record.chronicDiseases
                    .split(',')
                    .map(d => d.trim().toLowerCase())
                    .filter(d => d);

                diseases.forEach(disease => {
                    diseaseCount.set(disease, (diseaseCount.get(disease) || 0) + 1);
                });
            }
        });

        return Array.from(diseaseCount.entries())
            .map(([disease, count]) => ({ disease, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
}