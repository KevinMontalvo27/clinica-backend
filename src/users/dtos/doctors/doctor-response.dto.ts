import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../users/user-response.dto';

class SpecialtyInfo {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    basePrice: number;
}

@Exclude()
export class DoctorResponseDto {
    @ApiProperty({ description: 'ID del doctor' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'Información del usuario', type: UserResponseDto })
    @Expose()
    @Type(() => UserResponseDto)
    user: UserResponseDto;

    @ApiProperty({ description: 'Información de la especialidad', type: SpecialtyInfo })
    @Expose()
    @Type(() => SpecialtyInfo)
    specialty: SpecialtyInfo;

    @ApiProperty({ description: 'Número de cédula profesional' })
    @Expose()
    licenseNumber: string;

    @ApiPropertyOptional({ description: 'Años de experiencia' })
    @Expose()
    yearsExperience?: number;

    @ApiPropertyOptional({ description: 'Educación' })
    @Expose()
    education?: string;

    @ApiPropertyOptional({ description: 'Certificaciones' })
    @Expose()
    certifications?: string;

    @ApiPropertyOptional({ description: 'Precio de consulta' })
    @Expose()
    consultationPrice?: number;

    @ApiPropertyOptional({ description: 'Biografía' })
    @Expose()
    biography?: string;

    @ApiPropertyOptional({ description: 'URL de foto de perfil' })
    @Expose()
    profileImageUrl?: string;

    @ApiProperty({ description: 'Disponibilidad del doctor' })
    @Expose()
    isAvailable: boolean;

    @ApiProperty({ description: 'Fecha de creación' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Última actualización' })
    @Expose()
    updatedAt: Date;
}