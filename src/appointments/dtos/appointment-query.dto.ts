import { IsOptional, IsString, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AppointmentStatus } from './update-appointment-status.dto';

export class AppointmentQueryDto {
    @ApiPropertyOptional({ 
        description: 'Filtrar por ID del doctor', 
        example: 'uuid-doctor-123' 
    })
    @IsOptional()
    @IsString()
    doctorId?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por ID del paciente', 
        example: 'uuid-patient-456' 
    })
    @IsOptional()
    @IsString()
    patientId?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por estado', 
        example: 'SCHEDULED',
        enum: AppointmentStatus
    })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @ApiPropertyOptional({ 
        description: 'Fecha de inicio del rango', 
        example: '2025-11-01' 
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ 
        description: 'Fecha de fin del rango', 
        example: '2025-11-30' 
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ 
        description: 'Ordenar por campo', 
        example: 'appointmentDate',
        enum: ['appointmentDate', 'appointmentTime', 'createdAt', 'status']
    })
    @IsOptional()
    @IsEnum(['appointmentDate', 'appointmentTime', 'createdAt', 'status'])
    sortBy?: string;

    @ApiPropertyOptional({ 
        description: 'Orden ascendente o descendente', 
        example: 'ASC',
        enum: ['ASC', 'DESC']
    })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    order?: 'ASC' | 'DESC';

    @ApiPropertyOptional({ 
        description: 'Página actual', 
        example: 1,
        minimum: 1,
        default: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ 
        description: 'Cantidad de resultados por página', 
        example: 10,
        minimum: 1,
        default: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}