import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class GeneratedMedicalHistoryResponseDto {
    @ApiProperty({ description: 'ID del historial generado' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'ID del paciente' })
    @Expose()
    patientId: string;

    @ApiProperty({ description: 'ID del usuario que generó el historial' })
    @Expose()
    generatedBy: string;

    @ApiProperty({ description: 'Contenido del historial médico generado' })
    @Expose()
    content: string;

    @ApiProperty({ description: 'Formato del historial' })
    @Expose()
    format: string;

    @ApiProperty({ description: 'Tipo de historial' })
    @Expose()
    historyType: string;

    @ApiPropertyOptional({ description: 'Fecha de inicio del rango' })
    @Expose()
    startDate?: Date;

    @ApiPropertyOptional({ description: 'Fecha de fin del rango' })
    @Expose()
    endDate?: Date;

    @ApiProperty({ description: 'Si incluye signos vitales' })
    @Expose()
    includeVitalSigns: boolean;

    @ApiProperty({ description: 'Si incluye prescripciones' })
    @Expose()
    includePrescriptions: boolean;

    @ApiProperty({ description: 'Idioma del historial' })
    @Expose()
    language: string;

    @ApiProperty({ description: 'Fecha de generación' })
    @Expose()
    generatedAt: Date;

    @ApiPropertyOptional({ description: 'Tokens utilizados' })
    @Expose()
    tokensUsed?: number;

    @ApiPropertyOptional({ description: 'Notas adicionales' })
    @Expose()
    notes?: string;

    @ApiProperty({ description: 'Fecha de creación' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Última actualización' })
    @Expose()
    updatedAt: Date;
}