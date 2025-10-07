import { 
    IsString, 
    IsNotEmpty, 
    IsOptional,
    MaxLength,
    ValidateNested
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateUserDto } from '../users/create-user.dto';

export class CreatePatientDto {
    @ApiProperty({ 
        description: 'Información del usuario base',
        type: CreateUserDto
    })
    @ValidateNested()
    @Type(() => CreateUserDto)
    user: CreateUserDto;

    @ApiPropertyOptional({ 
        description: 'Nombre del contacto de emergencia', 
        example: 'María García' 
    })
    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'El nombre del contacto no puede exceder 100 caracteres' })
    emergencyContactName?: string;

    @ApiPropertyOptional({ 
        description: 'Teléfono del contacto de emergencia', 
        example: '+52 668 987 6543' 
    })
    @IsString()
    @IsOptional()
    @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
    emergencyContactPhone?: string;

    @ApiPropertyOptional({ 
        description: 'Proveedor de seguro médico', 
        example: 'IMSS' 
    })
    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'El proveedor de seguro no puede exceder 100 caracteres' })
    insuranceProvider?: string;

    @ApiPropertyOptional({ 
        description: 'Número de póliza de seguro', 
        example: '123456789' 
    })
    @IsString()
    @IsOptional()
    @MaxLength(50, { message: 'El número de seguro no puede exceder 50 caracteres' })
    insuranceNumber?: string;

    @ApiPropertyOptional({ 
        description: 'Tipo de sangre', 
        example: 'O+',
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    })
    @IsString()
    @IsOptional()
    @MaxLength(5, { message: 'El tipo de sangre no puede exceder 5 caracteres' })
    bloodType?: string;
}