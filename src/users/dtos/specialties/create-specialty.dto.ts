import { 
    IsString, 
    IsNotEmpty, 
    IsOptional,
    IsNumber,
    IsPositive,
    IsInt,
    MaxLength,
    Min
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSpecialtyDto {
    @ApiProperty({ 
        description: 'Nombre de la especialidad', 
        example: 'Cardiología',
        maxLength: 100
    })
    @IsString()
    @IsNotEmpty({ message: 'El nombre de la especialidad es requerido' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    name: string;

    @ApiPropertyOptional({ 
        description: 'Descripción de la especialidad', 
        example: 'Especialista en enfermedades del corazón y sistema cardiovascular' 
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ 
        description: 'Duración típica de consulta en minutos', 
        example: 30,
        minimum: 1,
        default: 30
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'La duración debe ser un número entero' })
    @Min(1, { message: 'La duración debe ser al menos 1 minuto' })
    consultationDuration?: number = 30;

    @ApiPropertyOptional({ 
        description: 'Precio base de la consulta', 
        example: 500.00,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El precio debe ser un número' })
    @IsPositive({ message: 'El precio debe ser positivo' })
    basePrice?: number;
}