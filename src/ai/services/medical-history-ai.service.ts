import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeminiService } from './gemini.service';
import { GeneratedMedicalHistory } from '../generated-medical-history.entity';
import { PatientsService } from '../../users/services/patients.service';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { ConsultationsService } from '../../medical-records/services/consultation.service';
import { MedicalRecordsService } from '../../medical-records/services/medical-record.service';
import { GenerateMedicalHistoryDto, MedicalHistoryType } from '../dtos/generate-medical-history.dto';
import { MedicalRecord } from 'src/medical-records/entities/medical-record.entity';
import { PdfGeneratorService } from './pdf-generator.service';

export interface MedicalHistoryData {
    patient: any;
    medicalRecord: any;
    appointments: any[];
    consultations: any[];
    statistics: any;
}

@Injectable()
export class MedicalHistoryAIService {
    private readonly logger = new Logger(MedicalHistoryAIService.name);

    constructor(
        @InjectRepository(GeneratedMedicalHistory)
        private readonly historyRepository: Repository<GeneratedMedicalHistory>,
        private readonly geminiService: GeminiService,
        private readonly patientsService: PatientsService,
        private readonly appointmentsService: AppointmentsService,
        private readonly consultationsService: ConsultationsService,
        private readonly medicalRecordsService: MedicalRecordsService,
        private readonly pdfGeneratorService: PdfGeneratorService, 
    ) {}

    /**
     * Genera un historial médico completo usando IA
     * @param patientId - ID del paciente
     * @param dto - Opciones de generación
     * @param requestingUserId - ID del usuario que solicita
     * @returns Historial médico generado
     */
    async generateMedicalHistory(
        patientId: string,
        dto: GenerateMedicalHistoryDto,
        requestingUserId: string,
    ): Promise<GeneratedMedicalHistory> {
        this.logger.log(`Generando historial médico para paciente: ${patientId}`);

        // 1. Validar permisos 
        await this.validatePermissions(patientId, requestingUserId);

        // 2. Recopilar todos los datos del paciente
        const medicalData = await this.collectMedicalData(patientId, dto);

        // 3. Construir el prompt para Gemini
        const prompt = this.buildPrompt(medicalData, dto);

        // 4. Generar contenido con Gemini
        const aiResponse = await this.geminiService.generateContentWithRetry({
            prompt,
            temperature: 0.7,
            maxTokens: 8192,
        });

        // 5. Guardar el historial generado
        const generatedHistory = this.historyRepository.create({
            patientId,
            generatedBy: requestingUserId,
            content: aiResponse.text,
            format: dto.format || 'markdown',
            historyType: dto.historyType || 'complete',
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            includeVitalSigns: dto.includeVitalSigns ?? true,
            includePrescriptions: dto.includePrescriptions ?? true,
            language: dto.language || 'es',
        });

        const saved = await this.historyRepository.save(generatedHistory);
        this.logger.log(`Historial médico generado y guardado con ID: ${saved.id}`);

        return saved;
    }

    /**
     * Obtiene historiales generados previamente
     * @param patientId - ID del paciente
     * @param limit - Número de historiales a obtener
     * @returns Lista de historiales generados
     */
    async getGeneratedHistories(patientId: string, limit: number = 10): Promise<GeneratedMedicalHistory[]> {
        return await this.historyRepository.find({
            where: { patientId },
            order: { generatedAt: 'DESC' },
            take: limit,
        });
    }

    /**
     * Obtiene un historial generado por ID
     * @param historyId - ID del historial
     * @returns Historial generado
     */
    async getHistoryById(historyId: string): Promise<GeneratedMedicalHistory> {
        const history = await this.historyRepository.findOne({
            where: { id: historyId },
        });

        if (!history) {
            throw new NotFoundException(`Historial con ID ${historyId} no encontrado`);
        }

        return history;
    }

    /**
     * Elimina un historial generado
     * @param historyId - ID del historial
     */
    async deleteHistory(historyId: string): Promise<void> {
        const history = await this.getHistoryById(historyId);
        await this.historyRepository.remove(history);
        this.logger.log(`Historial ${historyId} eliminado`);
    }

    /**
     * Recopila todos los datos médicos del paciente
     */
    private async collectMedicalData(
        patientId: string,
        dto: GenerateMedicalHistoryDto,
    ): Promise<MedicalHistoryData> {
        this.logger.debug(`Recopilando datos médicos del paciente ${patientId}`);

        // 1. Obtener datos del paciente
        const patient = await this.patientsService.findById(patientId);

        // 2. Expediente médico (DESHABILITADO TEMPORALMENTE)
        // Por ahora generamos el historial solo con consultas y datos del paciente
        // Cuando se implemente la gestión de expedientes médicos, descomentar:
        // let medicalRecord: MedicalRecord | null = null;
        // try {
        //     medicalRecord = await this.medicalRecordsService.findByPatient(patientId);
        // } catch (error) {
        //     this.logger.warn(`No se encontró expediente médico para el paciente ${patientId}`);
        // }
        const medicalRecord = null;
        this.logger.log(`Generando historial sin expediente médico formal (se extraerá info de consultas)`);

        // 3. Obtener citas con filtros de fecha opcionales
        const appointments = await this.appointmentsService.findByPatient(
            patientId,
            dto.startDate,
            dto.endDate,
        );

        // 4. Obtener consultas con filtros de fecha opcionales
        const consultations = await this.consultationsService.findByPatient(
            patientId,
            dto.startDate,
            dto.endDate,
        );

        // 5. Obtener estadísticas
        const statistics = await this.patientsService.getStatistics(patientId);

        this.logger.debug(
            `Datos recopilados: ${appointments.length} citas, ${consultations.length} consultas`,
        );

        return {
            patient,
            medicalRecord,
            appointments,
            consultations,
            statistics,
        };
    }

    /**
     * Construye el prompt para Gemini basado en los datos y opciones
     */
    private buildPrompt(data: MedicalHistoryData, dto: GenerateMedicalHistoryDto): string {
        const { patient, medicalRecord, appointments, consultations, statistics } = data;

        let prompt = '';

        // Instrucciones generales
        prompt += this.getGeneralInstructions(dto);

        // Información del paciente
        prompt += this.formatPatientInfo(patient, medicalRecord);

        // Historial de citas
        if (appointments.length > 0) {
            prompt += this.formatAppointmentsHistory(appointments);
        }

        // Consultas médicas detalladas
        if (consultations.length > 0) {
            prompt += this.formatConsultationsHistory(consultations, dto);
        }

        // Estadísticas
        prompt += this.formatStatistics(statistics);

        // Instrucciones finales
        prompt += this.getFinalInstructions(dto);

        this.logger.debug(`Prompt construido: ${prompt.length} caracteres`);
        return prompt;
    }

    /**
     * Genera instrucciones generales para Gemini
     */
    private getGeneralInstructions(dto: GenerateMedicalHistoryDto): string {
        const historyTypeMap: Record<string, string> = {
            complete: 'completo y detallado',
            summary: 'resumido',
            chronological: 'cronológico',
            by_systems: 'organizado por sistemas corporales',
        };

        const historyTypeDesc = dto.historyType 
            ? historyTypeMap[dto.historyType] || 'completo'
            : 'completo';

        let instructions = `
Eres un asistente médico experto. Tu tarea es generar un historial médico ${historyTypeDesc} del paciente basándote en la información proporcionada.

IMPORTANTE - INSTRUCCIONES CRÍTICAS:
- Usa un lenguaje ${dto.language === 'es' ? 'español' : 'inglés'} profesional y claro
- Sé objetivo y preciso
- Incluye solo información verificable de los datos proporcionados
- NO inventes ni asumas información que no esté explícitamente en los datos
- Si el paciente NO tiene expediente médico formal, DEBES extraer información relevante de las consultas previas
- DESTACA de forma PROMINENTE cualquier ALERGIA mencionada en consultas o expediente (usa emojis ⚠️ o negritas)
- Identifica PATRONES en signos vitales a lo largo del tiempo (tendencias de presión arterial, peso, etc.)
- Si se mencionan enfermedades crónicas o medicamentos en MÚLTIPLES consultas, resáltalos como condiciones recurrentes
- Analiza la evolución del paciente: ¿mejora? ¿empeora? ¿se mantiene estable?
- Si encuentras información contradictoria entre consultas, menciónalo

`;

        if (dto.notes) {
            instructions += `**NOTA ESPECIAL DEL SOLICITANTE:** ${dto.notes}\n\n`;
        }

        instructions += '---\n\n';
        return instructions;
    }

    /**
     * Formatea información básica del paciente
     */
    private formatPatientInfo(patient: any, medicalRecord: any): string {
        let info = '## INFORMACIÓN DEL PACIENTE\n\n';
        
        info += `**Nombre:** ${patient.user.firstName} ${patient.user.lastName}\n`;
        info += `**Fecha de nacimiento:** ${patient.user.dateOfBirth || 'No especificada'}\n`;
        info += `**Género:** ${patient.user.gender || 'No especificado'}\n`;
        info += `**Tipo de sangre:** ${patient.bloodType || 'No especificado'}\n`;
        info += `**Email:** ${patient.user.email}\n`;
        info += `**Teléfono:** ${patient.user.phone || 'No especificado'}\n\n`;

        if (patient.emergencyContactName) {
            info += `**Contacto de emergencia:** ${patient.emergencyContactName} - ${patient.emergencyContactPhone}\n\n`;
        }

        if (patient.insuranceProvider) {
            info += `**Seguro médico:** ${patient.insuranceProvider} (${patient.insuranceNumber})\n\n`;
        }

        // Expediente médico (OPCIONAL - puede no existir aún)
        if (medicalRecord) {
            info += '## EXPEDIENTE MÉDICO\n\n';
            
            if (medicalRecord.allergies) {
                info += `**⚠️ ALERGIAS:** ${medicalRecord.allergies}\n\n`;
            }
            
            if (medicalRecord.chronicDiseases) {
                info += `**Enfermedades crónicas:** ${medicalRecord.chronicDiseases}\n\n`;
            }
            
            if (medicalRecord.currentMedications) {
                info += `**Medicamentos actuales:** ${medicalRecord.currentMedications}\n\n`;
            }
            
            if (medicalRecord.familyHistory) {
                info += `**Historial familiar:** ${medicalRecord.familyHistory}\n\n`;
            }
            
            if (medicalRecord.medicalHistory) {
                info += `**Historial médico previo:** ${medicalRecord.medicalHistory}\n\n`;
            }
        } else {
            // Si no hay expediente médico, instruir a Gemini para extraer info de consultas
            info += '## ⚠️ NOTA IMPORTANTE SOBRE EL EXPEDIENTE MÉDICO\n\n';
            info += 'Este paciente aún no tiene un expediente médico formal registrado en el sistema. ';
            info += 'Por favor, genera el historial médico basándote en la información disponible de las consultas. ';
            info += 'Si durante las consultas se mencionan **alergias, enfermedades crónicas o medicamentos recurrentes**, ';
            info += 'DEBES incluirlos de forma DESTACADA en una sección especial al inicio del historial generado.\n\n';
        }

        return info;
    }

    /**
     * Formatea el historial de citas
     */
    private formatAppointmentsHistory(appointments: any[]): string {
        let info = '## HISTORIAL DE CITAS\n\n';
        info += `Total de citas: ${appointments.length}\n\n`;

        appointments.forEach((apt, index) => {
            info += `### Cita ${index + 1}\n`;
            info += `- **Fecha:** ${apt.appointmentDate} a las ${apt.appointmentTime}\n`;
            info += `- **Estado:** ${apt.status}\n`;
            info += `- **Doctor:** Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName} (${apt.doctor.specialty.name})\n`;
            
            if (apt.reasonForVisit) {
                info += `- **Motivo:** ${apt.reasonForVisit}\n`;
            }
            
            if (apt.notes) {
                info += `- **Notas:** ${apt.notes}\n`;
            }
            
            info += '\n';
        });

        return info;
    }

    /**
     * Formatea el historial de consultas
     */
    private formatConsultationsHistory(consultations: any[], dto: GenerateMedicalHistoryDto): string {
        let info = '## CONSULTAS MÉDICAS DETALLADAS\n\n';
        info += `Total de consultas: ${consultations.length}\n\n`;

        consultations.forEach((consult, index) => {
            info += `### Consulta ${index + 1} - ${consult.consultationDate}\n`;
            info += `**Doctor:** Dr. ${consult.doctor.user.firstName} ${consult.doctor.user.lastName} (${consult.doctor.specialty.name})\n\n`;

            // Signos vitales
            if (dto.includeVitalSigns !== false) {
                const vitalSigns: string[] = [];
                if (consult.weight) vitalSigns.push(`Peso: ${consult.weight} kg`);
                if (consult.height) vitalSigns.push(`Altura: ${consult.height} cm`);
                if (consult.bloodPressureSystolic && consult.bloodPressureDiastolic) {
                    vitalSigns.push(`Presión arterial: ${consult.bloodPressureSystolic}/${consult.bloodPressureDiastolic} mmHg`);
                }
                if (consult.heartRate) vitalSigns.push(`Frecuencia cardíaca: ${consult.heartRate} lpm`);
                if (consult.temperature) vitalSigns.push(`Temperatura: ${consult.temperature}°C`);

                if (vitalSigns.length > 0) {
                    info += `**Signos vitales:** ${vitalSigns.join(', ')}\n\n`;
                }
            }

            if (consult.chiefComplaint) {
                info += `**Motivo de consulta:** ${consult.chiefComplaint}\n\n`;
            }

            if (consult.symptoms) {
                info += `**Síntomas:** ${consult.symptoms}\n\n`;
            }

            if (consult.diagnosis) {
                info += `**Diagnóstico:** ${consult.diagnosis}\n\n`;
            }

            if (consult.treatmentPlan) {
                info += `**Plan de tratamiento:** ${consult.treatmentPlan}\n\n`;
            }

            if (dto.includePrescriptions !== false && consult.prescriptions) {
                info += `**Prescripciones:** ${consult.prescriptions}\n\n`;
            }

            if (consult.followUpInstructions) {
                info += `**Instrucciones de seguimiento:** ${consult.followUpInstructions}\n\n`;
            }

            if (consult.notes) {
                info += `**Notas adicionales:** ${consult.notes}\n\n`;
            }

            info += '---\n\n';
        });

        return info;
    }

    /**
     * Formatea estadísticas del paciente
     */
    private formatStatistics(statistics: any): string {
        let info = '## ESTADÍSTICAS\n\n';
        
        info += `- **Total de citas:** ${statistics.totalAppointments}\n`;
        info += `- **Citas completadas:** ${statistics.completedAppointments}\n`;
        info += `- **Citas canceladas:** ${statistics.cancelledAppointments}\n`;
        info += `- **Citas próximas:** ${statistics.upcomingAppointments}\n`;
        info += `- **Total de consultas:** ${statistics.totalConsultations}\n`;
        info += `- **Total de expedientes médicos:** ${statistics.totalMedicalRecords}\n\n`;

        return info;
    }

    /**
     * Genera instrucciones finales para Gemini
     */
    private getFinalInstructions(dto: GenerateMedicalHistoryDto): string {
        let instructions = '\n---\n\n';
        instructions += '## INSTRUCCIONES FINALES PARA GENERAR EL HISTORIAL\n\n';
        instructions += 'GENERA EL HISTORIAL MÉDICO BASÁNDOTE EN TODA LA INFORMACIÓN ANTERIOR.\n\n';

        if (dto.historyType === 'summary') {
            instructions += '**FORMATO REQUERIDO:** Resumen ejecutivo conciso (máximo 1000 palabras).\n';
        } else if (dto.historyType === 'by_systems') {
            instructions += '**FORMATO REQUERIDO:** Organiza por sistemas corporales:\n';
            instructions += '- Sistema Cardiovascular\n';
            instructions += '- Sistema Respiratorio\n';
            instructions += '- Sistema Digestivo\n';
            instructions += '- Sistema Neurológico\n';
            instructions += '- Sistema Musculoesquelético\n';
            instructions += '- Otros sistemas relevantes según los datos\n';
        } else if (dto.historyType === 'chronological') {
            instructions += '**FORMATO REQUERIDO:** Presenta la información en orden cronológico estricto (de más antiguo a más reciente).\n';
        } else {
            instructions += '**FORMATO REQUERIDO:** Historial médico completo y detallado.\n';
        }

        instructions += '\n**ESTRUCTURA OBLIGATORIA DEL HISTORIAL:**\n\n';
        instructions += '1. **RESUMEN EJECUTIVO** (2-3 párrafos al inicio)\n';
        instructions += '   - Estado de salud general actual\n';
        instructions += '   - Condiciones médicas principales\n';
        instructions += '   - Alergias y precauciones críticas (si aplican)\n\n';
        
        instructions += '2. **INFORMACIÓN CRÍTICA DE SEGURIDAD** (si aplica)\n';
        instructions += '   - ⚠️ Alergias conocidas o mencionadas en consultas\n';
        instructions += '   - ⚠️ Condiciones que requieren atención especial\n';
        instructions += '   - ⚠️ Medicamentos actuales o recurrentes\n\n';
        
        instructions += '3. **HISTORIAL MÉDICO DETALLADO**\n';
        instructions += '   - Consultas y diagnósticos\n';
        instructions += '   - Tratamientos aplicados\n';
        instructions += '   - Evolución del paciente\n\n';
        
        instructions += '4. **ANÁLISIS DE TENDENCIAS Y PATRONES**\n';
        instructions += '   - Cambios en signos vitales a lo largo del tiempo\n';
        instructions += '   - Diagnósticos recurrentes\n';
        instructions += '   - Respuesta a tratamientos\n\n';
        
        instructions += '5. **OBSERVACIONES Y RECOMENDACIONES** (si aplican)\n';
        instructions += '   - Áreas de preocupación\n';
        instructions += '   - Sugerencias de seguimiento\n';
        instructions += '   - Conclusiones relevantes\n\n';

        instructions += '**RECORDATORIO FINAL:**\n';
        instructions += '- Si NO existe expediente médico formal, extrae y destaca la información relevante de las consultas\n';
        instructions += '- Mantén un tono profesional pero comprensible\n';
        instructions += '- Prioriza la seguridad del paciente destacando alergias y condiciones críticas\n';
        instructions += '**Genera el expediente en idioma español, nada de ingles**\n';

        return instructions;
    }

    /**
     * Valida permisos del usuario para acceder al historial
     */
    private async validatePermissions(patientId: string, requestingUserId: string): Promise<void> {
        // TODO: Implementar lógica de autorización según tu sistema
        // Por ahora, solo validamos que el paciente exista
        
        try {
            await this.patientsService.findById(patientId);
        } catch (error) {
            throw new NotFoundException(`Paciente con ID ${patientId} no encontrado`);
        }

        // Aquí puedes agregar lógica para verificar que:
        // - Si es un paciente, solo puede ver su propio historial
        // - Si es un doctor, puede ver historiales de sus pacientes
        // - Si es admin, puede ver cualquier historial

        this.logger.debug(`Permisos validados para usuario ${requestingUserId} sobre paciente ${patientId}`);
    }

    /**
   * Genera un PDF del historial médico
   * @param historyId - ID del historial generado
   * @returns Buffer del PDF
   */
    async generatePdf(historyId: string): Promise<{
        buffer: Buffer;
        filename: string;
        patientName: string;
    }> {
        this.logger.log(`Generando PDF para historial: ${historyId}`);

        // 1. Obtener el historial de la base de datos
        const history = await this.getHistoryById(historyId);

        // 2. Obtener datos del paciente para metadata
        const patient = await this.patientsService.findById(history.patientId);
        const patientName = `${patient.user.firstName} ${patient.user.lastName}`;

        // 3. Generar el PDF
        const pdfBuffer = await this.pdfGeneratorService.generatePdfFromMarkdown(
        history.content,
        {
            patientName,
            generatedDate: history.generatedAt,
            clinicName: 'Sistema de Gestión Médica', // TODO: Obtener de configuración
            generatedBy: 'Doctor', // TODO: Obtener nombre del doctor
            documentId: history.id,
        },
        );

        // 4. Generar nombre de archivo
        const sanitizedName = patientName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/[^a-zA-Z0-9\s]/g, '') // Quitar caracteres especiales
        .replace(/\s+/g, '_'); // Reemplazar espacios por guión bajo

        const dateStr = history.generatedAt
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '');

        const filename = `Historial_Medico_${sanitizedName}_${dateStr}.pdf`;

        this.logger.log(`PDF generado exitosamente: ${filename}`);

        return {
        buffer: pdfBuffer,
        filename,
        patientName,
        };
    }

    /**
     * Guarda el PDF en el sistema de archivos (caché)
     * @param historyId - ID del historial
     * @param pdfBuffer - Buffer del PDF
     * @returns Ruta del archivo guardado
     */
    async savePdfToCache(historyId: string, pdfBuffer: Buffer): Promise<string> {
        const cacheDir = process.env.PDF_CACHE_DIR || './storage/pdfs';
        const filePath = `${cacheDir}/${historyId}.pdf`;

        // Crear directorio si no existe
        const fs = require('fs');
        const path = require('path');
        
        if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
        this.logger.debug(`Directorio de caché creado: ${cacheDir}`);
        }

        // Guardar archivo
        fs.writeFileSync(filePath, pdfBuffer);
        this.logger.log(`PDF guardado en caché: ${filePath}`);

        return filePath;
    }

    /**
     * Verifica si existe un PDF en caché
     * @param historyId - ID del historial
     * @returns Buffer del PDF si existe, null si no
     */
    async getPdfFromCache(historyId: string): Promise<Buffer | null> {
        const cacheDir = process.env.PDF_CACHE_DIR || './storage/pdfs';
        const filePath = `${cacheDir}/${historyId}.pdf`;

        const fs = require('fs');

        if (fs.existsSync(filePath)) {
        this.logger.debug(`PDF encontrado en caché: ${filePath}`);
        return fs.readFileSync(filePath);
        }

        this.logger.debug(`PDF no encontrado en caché: ${historyId}`);
        return null;
    }

    /**
     * Elimina PDF del caché
     * @param historyId - ID del historial
     */
    async deletePdfFromCache(historyId: string): Promise<void> {
        const cacheDir = process.env.PDF_CACHE_DIR || './storage/pdfs';
        const filePath = `${cacheDir}/${historyId}.pdf`;

        const fs = require('fs');

        if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`PDF eliminado del caché: ${filePath}`);
        }
    }
}