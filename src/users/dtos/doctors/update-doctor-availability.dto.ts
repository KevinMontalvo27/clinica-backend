import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDoctorAvailabilityDto {
    @ApiProperty({ 
        description: 'Disponibilidad del doctor', 
        example: true 
    })
    @IsBoolean({ message: 'La disponibilidad debe ser un valor booleano' })
    @IsNotEmpty({ message: 'La disponibilidad es requerida' })
    isAvailable: boolean;
}