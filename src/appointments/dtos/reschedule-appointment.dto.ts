import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
    @ApiProperty({ 
        description: 'Nueva fecha de la cita', 
        example: '2025-11-20' 
    })
    @IsDateString({}, { message: 'Debe ser una fecha válida en formato YYYY-MM-DD' })
    @IsNotEmpty({ message: 'La nueva fecha es requerida' })
    newDate: Date;

    @ApiProperty({ 
        description: 'Nueva hora de la cita', 
        example: '14:00' 
    })
    @IsString()
    @IsNotEmpty({ message: 'La nueva hora es requerida' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'La hora debe estar en formato HH:MM'
    })
    newTime: string;

    @ApiPropertyOptional({ 
        description: 'Razón del reagendamiento', 
        example: 'Paciente solicitó cambio por conflicto de horario' 
    })
    @IsString()
    @IsOptional()
    reason?: string;
}