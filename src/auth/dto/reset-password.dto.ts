import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Token de reseteo de contraseña',
        example: 'abc123token'
    })
    @IsString()
    @IsNotEmpty({ message: 'El token es requerido' })
    token: string;

    @ApiProperty({
        description: 'Nueva contraseña',
        example: 'NewPassword123!',
        minLength: 8
    })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
        { message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' }
    )
    newPassword: string;
}