import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

class PatientInfo {
    @Expose()
    id: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    email: string;

    @Expose()
    dateOfBirth?: Date;

    @Expose()
    bloodType?: string;
}

class DoctorInfo {
    @Expose()
    id: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    specialtyName: string;

    @Expose()
    licenseNumber: string;
}

@Exclude()
export class MedicalRecordResponseDto {
    @ApiProperty({ description: 'ID del expediente médico' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'Información del paciente', type: PatientInfo })
    @Expose()
    @Type(() => PatientInfo)
    patient: PatientInfo;

    @ApiProperty({ description: 'Información del doctor que creó el expediente', type: DoctorInfo })
    @Expose()
    @Type(() => DoctorInfo)
    createdBy: DoctorInfo;

    @ApiPropertyOptional({ description: 'Historial médico' })
    @Expose()
    medicalHistory?: string;

    @ApiPropertyOptional({ description: 'Historial familiar' })
    @Expose()
    familyHistory?: string;

    @ApiPropertyOptional({ description: 'Alergias' })
    @Expose()
    allergies?: string;

    @ApiPropertyOptional({ description: 'Enfermedades crónicas' })
    @Expose()
    chronicDiseases?: string;

    @ApiPropertyOptional({ description: 'Medicamentos actuales' })
    @Expose()
    currentMedications?: string;

    @ApiPropertyOptional({ description: 'Notas adicionales' })
    @Expose()
    notes?: string;

    @ApiProperty({ description: 'Fecha de creación del expediente' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Última actualización' })
    @Expose()
    updatedAt: Date;
}