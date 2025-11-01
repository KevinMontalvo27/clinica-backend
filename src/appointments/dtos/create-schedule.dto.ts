import { IsInt, IsNotEmpty, IsString, Matches, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
    @ApiProperty({ 
        description: 'ID del doctor', 
        example: 'uuid-doctor-123' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del doctor es requerido' })
    doctorId: string;

    @ApiProperty({ 
        description: 'Día de la semana (0=Domingo, 6=Sábado)', 
        example: 1,
        minimum: 0,
        maximum: 6
    })
    @Type(() => Number)
    @IsInt({ message: 'El día debe ser un número entero' })
    @Min(0, { message: 'El día debe ser entre 0 (Domingo) y 6 (Sábado)' })
    @Max(6, { message: 'El día debe ser entre 0 (Domingo) y 6 (Sábado)' })
    @IsNotEmpty({ message: 'El día de la semana es requerido' })
    dayOfWeek: number;

    @ApiProperty({ 
        description: 'Hora de inicio en formato HH:MM:SS', 
        example: '09:00:00' 
    })
    @IsString()
    @IsNotEmpty({ message: 'La hora de inicio es requerida' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'La hora de inicio debe estar en formato HH:MM:SS'
    })
    startTime: string;

    @ApiProperty({ 
        description: 'Hora de fin en formato HH:MM:SS', 
        example: '17:00:00' 
    })
    @IsString()
    @IsNotEmpty({ message: 'La hora de fin es requerida' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'La hora de fin debe estar en formato HH:MM:SS'
    })
    endTime: string;

    @ApiPropertyOptional({ 
        description: 'Si el horario está activo', 
        example: true,
        default: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}