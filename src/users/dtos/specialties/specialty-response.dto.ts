import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SpecialtyResponseDto {
    @ApiProperty({ description: 'ID de la especialidad', example: 'uuid-123' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'Nombre de la especialidad', example: 'Cardiología' })
    @Expose()
    name: string;

    @ApiPropertyOptional({ 
        description: 'Descripción de la especialidad',
        example: 'Especialista en enfermedades del corazón' 
    })
    @Expose()
    description?: string;

    @ApiProperty({ 
        description: 'Duración de consulta en minutos',
        example: 30
    })
    @Expose()
    consultationDuration: number;

    @ApiPropertyOptional({ 
        description: 'Precio base de la consulta',
        example: 500.00
    })
    @Expose()
    basePrice?: number;

    @ApiProperty({ description: 'Fecha de creación' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Fecha de última actualización' })
    @Expose()
    updatedAt: Date;

    @ApiPropertyOptional({ description: 'Cantidad de doctores en esta especialidad' })
    @Expose()
    doctorsCount?: number;
}