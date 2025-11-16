import { IsOptional, IsString, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ConsultationQueryDto {
    @ApiPropertyOptional({ 
        description: 'Filtrar por ID del paciente', 
        example: 'uuid-patient-123' 
    })
    @IsOptional()
    @IsString()
    patientId?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por ID del doctor', 
        example: 'uuid-doctor-456' 
    })
    @IsOptional()
    @IsString()
    doctorId?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por ID de la cita', 
        example: 'uuid-appointment-789' 
    })
    @IsOptional()
    @IsString()
    appointmentId?: string;

    @ApiPropertyOptional({ 
        description: 'Fecha de inicio del rango', 
        example: '2025-01-01' 
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ 
        description: 'Fecha de fin del rango', 
        example: '2025-12-31' 
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ 
        description: 'Buscar en diagnóstico', 
        example: 'diabetes' 
    })
    @IsOptional()
    @IsString()
    diagnosisSearch?: string;

    @ApiPropertyOptional({ 
        description: 'Ordenar por campo', 
        example: 'consultationDate',
        enum: ['consultationDate', 'createdAt']
    })
    @IsOptional()
    @IsEnum(['consultationDate', 'createdAt'])
    sortBy?: string;

    @ApiPropertyOptional({ 
        description: 'Orden ascendente o descendente', 
        example: 'DESC',
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