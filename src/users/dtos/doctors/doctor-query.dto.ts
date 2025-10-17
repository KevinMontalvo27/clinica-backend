import { IsOptional, IsString, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DoctorQueryDto {
    @ApiPropertyOptional({ 
        description: 'Buscar por nombre o apellido del doctor', 
        example: 'García' 
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por ID de especialidad', 
        example: 'uuid-specialty-123' 
    })
    @IsOptional()
    @IsString()
    specialtyId?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por disponibilidad', 
        example: true 
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isAvailable?: boolean;

    @ApiPropertyOptional({ 
        description: 'Filtrar por estado activo del usuario', 
        example: true 
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ 
        description: 'Años mínimos de experiencia', 
        example: 5,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minYearsExperience?: number;

    @ApiPropertyOptional({ 
        description: 'Precio máximo de consulta', 
        example: 1000,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({ 
        description: 'Ordenar por campo', 
        example: 'createdAt',
        enum: ['createdAt', 'firstName', 'lastName', 'yearsExperience', 'consultationPrice']
    })
    @IsOptional()
    @IsEnum(['createdAt', 'firstName', 'lastName', 'yearsExperience', 'consultationPrice'])
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