import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

class RoleInfo {
    @Expose()
    id: string;

    @Expose()
    name: string;
}

@Exclude()
export class UserResponseDto {
    @ApiProperty({ description: 'ID del usuario' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'Email del usuario' })
    @Expose()
    email: string;

    @ApiProperty({ description: 'Nombre del usuario' })
    @Expose()
    firstName: string;

    @ApiProperty({ description: 'Apellido del usuario' })
    @Expose()
    lastName: string;

    @ApiPropertyOptional({ description: 'Teléfono del usuario' })
    @Expose()
    phone?: string;

    @ApiPropertyOptional({ description: 'Fecha de nacimiento' })
    @Expose()
    dateOfBirth?: Date;

    @ApiPropertyOptional({ description: 'Género' })
    @Expose()
    gender?: string;

    @ApiPropertyOptional({ description: 'Dirección' })
    @Expose()
    address?: string;

    @ApiProperty({ description: 'Estado del usuario' })
    @Expose()
    isActive: boolean;

    @ApiProperty({ description: 'Email verificado' })
    @Expose()
    emailVerified: boolean;

    @ApiProperty({ description: 'Información del rol' })
    @Expose()
    @Type(() => RoleInfo)
    role: RoleInfo;

    @ApiProperty({ description: 'Fecha de creación' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Última actualización' })
    @Expose()
    updatedAt: Date;

  // passwordHash está excluido por @Exclude() de la clase
}