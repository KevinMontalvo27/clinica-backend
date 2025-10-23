import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({
        description: 'Email del usuario',
        example: 'user@example.com'
    })
    @IsEmail({}, { message: 'Debe ser un email válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email: string;
}