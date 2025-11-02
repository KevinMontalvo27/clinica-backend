import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    NO_SHOW = 'NO_SHOW',
    RESCHEDULED = 'RESCHEDULED'
}

export class UpdateAppointmentStatusDto {
    @ApiProperty({ 
        description: 'Nuevo estado de la cita', 
        example: 'CONFIRMED',
        enum: AppointmentStatus
    })
    @IsEnum(AppointmentStatus, { 
        message: 'El estado debe ser: SCHEDULED, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, o RESCHEDULED' 
    })
    @IsNotEmpty({ message: 'El estado es requerido' })
    status: AppointmentStatus;

    @ApiPropertyOptional({ 
        description: 'Razón del cambio de estado', 
        example: 'Paciente confirmó asistencia por teléfono' 
    })
    @IsString()
    @IsOptional()
    reason?: string;
}