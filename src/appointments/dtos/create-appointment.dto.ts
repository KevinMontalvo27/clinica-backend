import { 
    IsString, 
    IsNotEmpty, 
    IsOptional,
    IsDateString,
    IsNumber,
    Min,
    Matches,
    MaxLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
    @ApiProperty({ 
        description: 'Fecha de la cita', 
        example: '2025-11-15' 
    })
    @IsDateString({}, { message: 'Debe ser una fecha válida en formato YYYY-MM-DD' })
    @IsNotEmpty({ message: 'La fecha de la cita es requerida' })
    appointmentDate: Date;

    @ApiProperty({ 
        description: 'Hora de la cita en formato HH:MM', 
        example: '10:30' 
    })
    @IsString()
    @IsNotEmpty({ message: 'La hora de la cita es requerida' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'La hora debe estar en formato HH:MM (ej: 10:30)'
    })
    appointmentTime: string;

    @ApiPropertyOptional({ 
        description: 'Duración de la cita en minutos', 
        example: 30,
        default: 30,
        minimum: 15
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'La duración debe ser un número' })
    @Min(15, { message: 'La duración mínima es 15 minutos' })
    duration?: number;

    @ApiPropertyOptional({ 
        description: 'Motivo de la visita', 
        example: 'Consulta de seguimiento por presión alta' 
    })
    @IsString()
    @IsOptional()
    reasonForVisit?: string;

    @ApiPropertyOptional({ 
        description: 'Notas adicionales', 
        example: 'Paciente prefiere cita por la mañana' 
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({ 
        description: 'Precio de la cita', 
        example: 800.00,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El precio debe ser un número' })
    @Min(0, { message: 'El precio no puede ser negativo' })
    price?: number;

    @ApiProperty({ 
        description: 'ID del paciente', 
        example: 'uuid-patient-123' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del paciente es requerido' })
    patientId: string;

    @ApiProperty({ 
        description: 'ID del doctor', 
        example: 'uuid-doctor-456' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del doctor es requerido' })
    doctorId: string;

    @ApiPropertyOptional({ 
        description: 'ID del servicio/especialidad', 
        example: 'uuid-service-789' 
    })
    @IsString()
    @IsOptional()
    serviceId?: string;
}