import { 
    IsString, 
    IsOptional, 
    IsEnum, 
    IsBoolean,
    IsDateString
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MedicalHistoryType {
    COMPLETE = 'complete',
    SUMMARY = 'summary',
    CHRONOLOGICAL = 'chronological',
    BY_SYSTEMS = 'by_systems',
}

export enum MedicalHistoryFormat {
    MARKDOWN = 'markdown',
    HTML = 'html',
    JSON = 'json',
    PLAIN_TEXT = 'plain_text',
}

export enum Language {
    SPANISH = 'es',
    ENGLISH = 'en',
}

export class GenerateMedicalHistoryDto {
    @ApiPropertyOptional({
        description: 'Tipo de historial médico a generar',
        enum: MedicalHistoryType,
        example: MedicalHistoryType.COMPLETE,
        default: MedicalHistoryType.COMPLETE,
    })
    @IsOptional()
    @IsEnum(MedicalHistoryType, {
        message: 'El tipo debe ser: complete, summary, chronological o by_systems',
    })
    historyType?: MedicalHistoryType;

    @ApiPropertyOptional({
        description: 'Formato de salida del historial',
        enum: MedicalHistoryFormat,
        example: MedicalHistoryFormat.MARKDOWN,
        default: MedicalHistoryFormat.MARKDOWN,
    })
    @IsOptional()
    @IsEnum(MedicalHistoryFormat, {
        message: 'El formato debe ser: markdown, html, json o plain_text',
    })
    format?: MedicalHistoryFormat;

    @ApiPropertyOptional({
        description: 'Fecha de inicio del rango de datos a incluir',
        example: '2023-01-01',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Debe ser una fecha válida en formato YYYY-MM-DD' })
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Fecha de fin del rango de datos a incluir',
        example: '2024-12-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Debe ser una fecha válida en formato YYYY-MM-DD' })
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Incluir signos vitales en el historial',
        example: true,
        default: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    includeVitalSigns?: boolean;

    @ApiPropertyOptional({
        description: 'Incluir prescripciones en el historial',
        example: true,
        default: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    includePrescriptions?: boolean;

    @ApiPropertyOptional({
        description: 'Idioma del historial generado',
        enum: Language,
        example: Language.SPANISH,
        default: Language.SPANISH,
    })
    @IsOptional()
    @IsEnum(Language, {
        message: 'El idioma debe ser: es (español) o en (inglés)',
    })
    language?: Language;

    @ApiPropertyOptional({
        description: 'Notas adicionales sobre lo que se desea en el historial',
        example: 'Enfocarse en problemas cardiovasculares',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}