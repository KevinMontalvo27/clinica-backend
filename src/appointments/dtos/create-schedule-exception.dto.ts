import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleExceptionDto {
    @ApiProperty({ 
        description: 'ID del doctor', 
        example: 'uuid-doctor-123' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del doctor es requerido' })
    doctorId: string;

    @ApiProperty({ 
        description: 'Fecha de la excepción', 
        example: '2025-12-25' 
    })
    @IsDateString({}, { message: 'Debe ser una fecha válida' })
    @IsNotEmpty({ message: 'La fecha es requerida' })
    exceptionDate: Date;

    @ApiPropertyOptional({ 
        description: 'Hora de inicio (si es excepción parcial)', 
        example: '14:00:00' 
    })
    @IsOptional()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    startTime?: string;

    @ApiPropertyOptional({ 
        description: 'Hora de fin (si es excepción parcial)', 
        example: '16:00:00' 
    })
    @IsOptional()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    endTime?: string;

    @ApiPropertyOptional({ 
        description: 'Razón de la excepción', 
        example: 'Día festivo - Navidad' 
    })
    @IsString()
    @IsOptional()
    reason?: string;
}