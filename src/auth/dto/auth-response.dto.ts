import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

class UserInfo {
    @Expose()
    id: string;

    @Expose()
    email: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    role: string;

    @Expose()
    isActive: boolean;

    @Expose()
    emailVerified: boolean;
}

@Exclude()
export class AuthResponseDto {
    @ApiProperty({
        description: 'Token de acceso JWT',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    @Expose()
    accessToken: string;

    @ApiProperty({
        description: 'Información del usuario autenticado',
        type: UserInfo
    })
    @Expose()
    user: UserInfo;
}