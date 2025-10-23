import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        description: 'Email del usuario',
        example: 'doctor@example.com'
    })
    @IsEmail({}, { message: 'Debe ser un email válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email: string;

    @ApiProperty({
        description: 'Contraseña del usuario',
        example: 'Password123!'
    })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    password: string;
}