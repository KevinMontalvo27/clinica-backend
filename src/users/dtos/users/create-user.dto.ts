import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";



export class CreateUserDto {
    @ApiProperty({
        description: "Correo del usuario",
        example: "user@example.com"
    })

    @IsEmail({}, { message: 'Debe ser un email valido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email: string;

    @ApiProperty({
        description: "Contraseña del usuario",
        example: "strongPassword123",
        minLength: 8
    })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    { message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' }
    )
    password: string;

    @ApiProperty({ 
        description: 'Nombre del usuario', 
        example: 'Juan' 
    })
    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    firstName: string;

    @ApiProperty({ 
        description: 'Apellido del usuario', 
        example: 'Pérez'
    })
    @IsString()
    @IsNotEmpty({ message: 'El apellido es requerido' })
    @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
    lastName: string;

    @ApiPropertyOptional({ 
        description: 'Número de teléfono del usuario', 
        example: '+1234567890'
    })
    @IsString()
    @IsOptional()
    @MaxLength(15, { message: 'El teléfono no puede exceder 15 caracteres' })
    phone?: string;

    @ApiPropertyOptional({ 
        description: 'Fecha de nacimiento del usuario', 
        example: '1990-01-01' 
    })
    @IsOptional()
    @IsDateString({}, { message: 'Debe ser una fecha valida en formato YYYY-MM-DD' })
    dateOfBirth?: Date;

    @ApiPropertyOptional({ 
        description: 'Género del usuario', 
        example: 'MALE',
        enum: ['MALE', 'FEMALE', 'OTHER']
    })
    @IsEnum(['MALE', 'FEMALE', 'OTHER'], { message: 'El género debe ser MALE, FEMALE u OTHER' })
    @IsOptional()
    gender?: string;

    @ApiPropertyOptional({ 
        description: 'Dirección del usuario', 
        example: 'Calle Falsa 123, Ciudad, País'
    })
    @IsString()
    @IsOptional()
    @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
    address?: string;

    @ApiProperty({ 
        description: 'ID del rol asignado al usuario', 
        example: 'uuid-role-id'
    })
    @IsString()
    @IsNotEmpty({ message: 'El roleId es requerido' })
    roleId: string;    


}