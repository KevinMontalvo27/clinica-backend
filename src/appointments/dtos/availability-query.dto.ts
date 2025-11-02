import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityQueryDto {
    @ApiProperty({ 
        description: 'ID del doctor', 
        example: 'uuid-doctor-123' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El ID del doctor es requerido' })
    doctorId: string;

    @ApiProperty({ 
        description: 'Fecha para consultar disponibilidad', 
        example: '2025-11-15' 
    })
    @IsDateString({}, { message: 'Debe ser una fecha válida' })
    @IsNotEmpty({ message: 'La fecha es requerida' })
    date: string;

    @ApiPropertyOptional({ 
        description: 'ID del servicio (opcional)', 
        example: 'uuid-service-789' 
    })
    @IsString()
    @IsOptional()
    serviceId?: string;
}