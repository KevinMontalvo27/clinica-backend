import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MedicalRecordQueryDto {
    @ApiPropertyOptional({ 
        description: 'Filtrar por ID del paciente', 
        example: 'uuid-patient-123' 
    })
    @IsOptional()
    @IsString()
    patientId?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por ID del doctor creador', 
        example: 'uuid-doctor-456' 
    })
    @IsOptional()
    @IsString()
    doctorId?: string;

    @ApiPropertyOptional({ 
        description: 'Buscar en alergias', 
        example: 'penicilina' 
    })
    @IsOptional()
    @IsString()
    allergySearch?: string;

    @ApiPropertyOptional({ 
        description: 'Buscar en enfermedades crónicas', 
        example: 'diabetes' 
    })
    @IsOptional()
    @IsString()
    diseaseSearch?: string;

    @ApiPropertyOptional({ 
        description: 'Ordenar por campo', 
        example: 'createdAt',
        enum: ['createdAt', 'updatedAt']
    })
    @IsOptional()
    @IsEnum(['createdAt', 'updatedAt'])
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