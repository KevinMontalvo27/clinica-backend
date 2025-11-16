import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

class PatientBasicInfo {
    @Expose()
    id: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    email: string;
}

class DoctorBasicInfo {
    @Expose()
    id: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    specialtyName: string;
}

class VitalSigns {
    @Expose()
    weight?: number;

    @Expose()
    height?: number;

    @Expose()
    bloodPressureSystolic?: number;

    @Expose()
    bloodPressureDiastolic?: number;

    @Expose()
    heartRate?: number;

    @Expose()
    temperature?: number;
}

@Exclude()
export class ConsultationResponseDto {
    @ApiProperty({ description: 'ID de la consulta' })
    @Expose()
    id: string;

    @ApiPropertyOptional({ description: 'ID de la cita asociada' })
    @Expose()
    appointmentId?: string;

    @ApiProperty({ description: 'Información básica del paciente', type: PatientBasicInfo })
    @Expose()
    @Type(() => PatientBasicInfo)
    patient: PatientBasicInfo;

    @ApiProperty({ description: 'Información básica del doctor', type: DoctorBasicInfo })
    @Expose()
    @Type(() => DoctorBasicInfo)
    doctor: DoctorBasicInfo;

    @ApiPropertyOptional({ description: 'Signos vitales', type: VitalSigns })
    @Expose()
    @Type(() => VitalSigns)
    vitalSigns?: VitalSigns;

    @ApiPropertyOptional({ description: 'Motivo principal de consulta' })
    @Expose()
    chiefComplaint?: string;

    @ApiPropertyOptional({ description: 'Síntomas' })
    @Expose()
    symptoms?: string;

    @ApiPropertyOptional({ description: 'Diagnóstico' })
    @Expose()
    diagnosis?: string;

    @ApiPropertyOptional({ description: 'Plan de tratamiento' })
    @Expose()
    treatmentPlan?: string;

    @ApiPropertyOptional({ description: 'Prescripciones' })
    @Expose()
    prescriptions?: string;

    @ApiPropertyOptional({ description: 'Instrucciones de seguimiento' })
    @Expose()
    followUpInstructions?: string;

    @ApiPropertyOptional({ description: 'Archivos adjuntos' })
    @Expose()
    attachments?: string;

    @ApiPropertyOptional({ description: 'Notas adicionales' })
    @Expose()
    notes?: string;

    @ApiProperty({ description: 'Fecha de la consulta' })
    @Expose()
    consultationDate: Date;

    @ApiProperty({ description: 'Fecha de creación del registro' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Última actualización' })
    @Expose()
    updatedAt: Date;
}