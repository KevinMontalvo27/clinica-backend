import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PatientQueryDto {
    @ApiPropertyOptional({ 
        description: 'Buscar por nombre o apellido', 
        example: 'Juan' 
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por tipo de sangre', 
        example: 'O+',
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    })
    @IsOptional()
    @IsString()
    bloodType?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por estado activo', 
        example: true 
    })
    @IsOptional()
    @Type(() => Boolean)
    isActive?: boolean;

    @ApiPropertyOptional({ 
        description: 'Ordenar por campo', 
        example: 'createdAt',
        enum: ['createdAt', 'firstName', 'lastName']
    })
    @IsOptional()
    @IsEnum(['createdAt', 'firstName', 'lastName'])
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