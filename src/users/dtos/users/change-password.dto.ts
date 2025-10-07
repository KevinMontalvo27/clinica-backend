import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({ 
        description: 'Contraseña actual', 
        example: 'OldPassword123!' 
    })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña actual es requerida' })
    currentPassword: string;

    @ApiProperty({ 
        description: 'Nueva contraseña', 
        example: 'NewPassword123!',
        minLength: 8
    })
    @IsString()
    @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
    @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
        { message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' }
    )
    newPassword: string;

    @ApiProperty({ 
        description: 'Confirmación de nueva contraseña', 
        example: 'NewPassword123!' 
    })
    @IsString()
    @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
    confirmPassword: string;
}