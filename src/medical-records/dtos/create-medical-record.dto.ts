import { 
    IsString, 
    IsNotEmpty, 
    IsOptional
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
    @ApiProperty({ 
        description: 'ID del paciente', 
        example: 'uuid-patient-123' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del paciente es requerido' })
    patientId: string;

    @ApiProperty({ 
        description: 'ID del doctor que crea el expediente', 
        example: 'uuid-doctor-456' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del doctor es requerido' })
    created_by: string;

    @ApiPropertyOptional({ 
        description: 'Historial médico del paciente', 
        example: 'Cirugía de apendicitis en 2015, Fractura de brazo derecho en 2018' 
    })
    @IsString()
    @IsOptional()
    medicalHistory?: string;

    @ApiPropertyOptional({ 
        description: 'Historial médico familiar', 
        example: 'Padre con diabetes tipo 2, Madre con hipertensión' 
    })
    @IsString()
    @IsOptional()
    familyHistory?: string;

    @ApiPropertyOptional({ 
        description: 'Alergias conocidas', 
        example: 'Penicilina, Polen, Mariscos' 
    })
    @IsString()
    @IsOptional()
    allergies?: string;

    @ApiPropertyOptional({ 
        description: 'Enfermedades crónicas', 
        example: 'Asma, Hipertensión arterial' 
    })
    @IsString()
    @IsOptional()
    chronicDiseases?: string;

    @ApiPropertyOptional({ 
        description: 'Medicamentos actuales', 
        example: 'Losartán 50mg diario, Salbutamol inhalador según necesidad' 
    })
    @IsString()
    @IsOptional()
    currentMedications?: string;

    @ApiPropertyOptional({ 
        description: 'Notas adicionales', 
        example: 'Paciente activo físicamente, dieta balanceada' 
    })
    @IsString()
    @IsOptional()
    notes?: string;
}