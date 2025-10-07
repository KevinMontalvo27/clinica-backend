import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../users/user-response.dto';

@Exclude()
export class PatientResponseDto {
    @ApiProperty({ description: 'ID del paciente' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'Información del usuario', type: UserResponseDto })
    @Expose()
    @Type(() => UserResponseDto)
    user: UserResponseDto;

    @ApiPropertyOptional({ description: 'Nombre del contacto de emergencia' })
    @Expose()
    emergencyContactName?: string;

    @ApiPropertyOptional({ description: 'Teléfono del contacto de emergencia' })
    @Expose()
    emergencyContactPhone?: string;

    @ApiPropertyOptional({ description: 'Proveedor de seguro médico' })
    @Expose()
    insuranceProvider?: string;

    @ApiPropertyOptional({ description: 'Número de póliza de seguro' })
    @Expose()
    insuranceNumber?: string;

    @ApiPropertyOptional({ description: 'Tipo de sangre' })
    @Expose()
    bloodType?: string;

    @ApiProperty({ description: 'Fecha de creación' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Última actualización' })
    @Expose()
    updatedAt: Date;
}