import { 
    IsString, 
    IsNotEmpty, 
    IsOptional,
    IsNumber,
    IsInt,
    Min,
    Max,
    MaxLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateConsultationDto {
    @ApiPropertyOptional({ 
        description: 'ID de la cita asociada', 
        example: 'uuid-appointment-123' 
    })
    @IsString()
    @IsOptional()
    appointmentId?: string;

    @ApiProperty({ 
        description: 'ID del paciente', 
        example: 'uuid-patient-456' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del paciente es requerido' })
    patientId: string;

    @ApiProperty({ 
        description: 'ID del doctor', 
        example: 'uuid-doctor-789' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del doctor es requerido' })
    doctorId: string;

    // ========== SIGNOS VITALES ==========
    
    @ApiPropertyOptional({ 
        description: 'Peso en kilogramos', 
        example: 70.5,
        minimum: 0,
        maximum: 500
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El peso debe ser un número' })
    @Min(0, { message: 'El peso no puede ser negativo' })
    @Max(500, { message: 'El peso máximo es 500 kg' })
    weight?: number;

    @ApiPropertyOptional({ 
        description: 'Altura en centímetros', 
        example: 175,
        minimum: 0,
        maximum: 300
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'La altura debe ser un número' })
    @Min(0, { message: 'La altura no puede ser negativa' })
    @Max(300, { message: 'La altura máxima es 300 cm' })
    height?: number;

    @ApiPropertyOptional({ 
        description: 'Presión arterial sistólica (mmHg)', 
        example: 120,
        minimum: 50,
        maximum: 300
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'La presión sistólica debe ser un número entero' })
    @Min(50, { message: 'La presión sistólica mínima es 50 mmHg' })
    @Max(300, { message: 'La presión sistólica máxima es 300 mmHg' })
    bloodPressureSystolic?: number;

    @ApiPropertyOptional({ 
        description: 'Presión arterial diastólica (mmHg)', 
        example: 80,
        minimum: 30,
        maximum: 200
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'La presión diastólica debe ser un número entero' })
    @Min(30, { message: 'La presión diastólica mínima es 30 mmHg' })
    @Max(200, { message: 'La presión diastólica máxima es 200 mmHg' })
    bloodPressureDiastolic?: number;

    @ApiPropertyOptional({ 
        description: 'Frecuencia cardíaca (latidos por minuto)', 
        example: 72,
        minimum: 30,
        maximum: 250
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'La frecuencia cardíaca debe ser un número entero' })
    @Min(30, { message: 'La frecuencia cardíaca mínima es 30 lpm' })
    @Max(250, { message: 'La frecuencia cardíaca máxima es 250 lpm' })
    heartRate?: number;

    @ApiPropertyOptional({ 
        description: 'Temperatura corporal (°C)', 
        example: 36.5,
        minimum: 30,
        maximum: 45
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'La temperatura debe ser un número' })
    @Min(30, { message: 'La temperatura mínima es 30°C' })
    @Max(45, { message: 'La temperatura máxima es 45°C' })
    temperature?: number;

    // ========== INFORMACIÓN DE LA CONSULTA ==========

    @ApiPropertyOptional({ 
        description: 'Motivo principal de la consulta', 
        example: 'Dolor de cabeza persistente por 3 días' 
    })
    @IsString()
    @IsOptional()
    chiefComplaint?: string;

    @ApiPropertyOptional({ 
        description: 'Síntomas detallados del paciente', 
        example: 'Dolor punzante en la sien derecha, sensibilidad a la luz, náuseas ocasionales' 
    })
    @IsString()
    @IsOptional()
    symptoms?: string;

    @ApiPropertyOptional({ 
        description: 'Diagnóstico médico', 
        example: 'Migraña con aura' 
    })
    @IsString()
    @IsOptional()
    diagnosis?: string;

    @ApiPropertyOptional({ 
        description: 'Plan de tratamiento', 
        example: 'Iniciar tratamiento con analgésicos, reposo, y seguimiento en 2 semanas' 
    })
    @IsString()
    @IsOptional()
    treatmentPlan?: string;

    @ApiPropertyOptional({ 
        description: 'Prescripciones médicas', 
        example: 'Ibuprofeno 400mg cada 8 horas por 5 días, Paracetamol 500mg en caso de dolor severo' 
    })
    @IsString()
    @IsOptional()
    prescriptions?: string;

    @ApiPropertyOptional({ 
        description: 'Instrucciones de seguimiento', 
        example: 'Regresar en 2 semanas si los síntomas persisten. Acudir a urgencias si presenta vómito persistente.' 
    })
    @IsString()
    @IsOptional()
    followUpInstructions?: string;

    @ApiPropertyOptional({ 
        description: 'URLs o rutas de archivos adjuntos (JSON string)', 
        example: '["https://example.com/lab-results.pdf", "https://example.com/xray.jpg"]' 
    })
    @IsString()
    @IsOptional()
    attachments?: string;

    @ApiPropertyOptional({ 
        description: 'Notas adicionales del médico', 
        example: 'Paciente muestra buena respuesta al tratamiento anterior' 
    })
    @IsString()
    @IsOptional()
    notes?: string;
}