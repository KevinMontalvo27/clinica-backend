import { 
    IsString, 
    IsNotEmpty, 
    IsOptional,
    IsNumber,
    IsPositive,
    IsUrl,
    MaxLength,
    ValidateNested,
    Min
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateUserDto } from '../users/create-user.dto';

export class CreateDoctorDto {
    @ApiProperty({ 
        description: 'Información del usuario base',
        type: CreateUserDto
    })
    @ValidateNested()
    @Type(() => CreateUserDto)
    user: CreateUserDto;

    @ApiProperty({ 
        description: 'ID de la especialidad del doctor', 
        example: 'uuid-specialty-123' 
    })
    @IsString()
    @IsNotEmpty({ message: 'La especialidad es requerida' })
    specialtyId: string;

    @ApiProperty({ 
        description: 'Número de cédula profesional', 
        example: '1234567' 
    })
    @IsString()
    @IsNotEmpty({ message: 'La cédula profesional es requerida' })
    @MaxLength(50, { message: 'La cédula no puede exceder 50 caracteres' })
    licenseNumber: string;

    @ApiPropertyOptional({ 
        description: 'Años de experiencia', 
        example: 10,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Los años de experiencia deben ser un número' })
    @Min(0, { message: 'Los años de experiencia no pueden ser negativos' })
    yearsExperience?: number;

    @ApiPropertyOptional({ 
        description: 'Educación del doctor', 
        example: 'Universidad Nacional Autónoma de México - Medicina General' 
    })
    @IsString()
    @IsOptional()
    education?: string;

    @ApiPropertyOptional({ 
        description: 'Certificaciones del doctor', 
        example: 'Certificado por el Consejo Mexicano de Cardiología' 
    })
    @IsString()
    @IsOptional()
    certifications?: string;

    @ApiPropertyOptional({ 
        description: 'Precio de consulta', 
        example: 500.00,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El precio debe ser un número' })
    @IsPositive({ message: 'El precio debe ser positivo' })
    consultationPrice?: number;

    @ApiPropertyOptional({ 
        description: 'Biografía del doctor', 
        example: 'Especialista en cardiología con más de 10 años de experiencia...' 
    })
    @IsString()
    @IsOptional()
    biography?: string;

    @ApiPropertyOptional({ 
        description: 'URL de la foto de perfil', 
        example: 'https://example.com/profiles/doctor123.jpg' 
    })
    @IsOptional()
    @IsUrl({}, { message: 'Debe ser una URL válida' })
    @MaxLength(500, { message: 'La URL no puede exceder 500 caracteres' })
    profileImageUrl?: string;
}