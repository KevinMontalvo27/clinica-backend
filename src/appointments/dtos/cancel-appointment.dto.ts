import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelAppointmentDto {
    @ApiProperty({ 
        description: 'Razón de la cancelación', 
        example: 'Paciente enfermo, imposible asistir',
        maxLength: 500
    })
    @IsString()
    @IsNotEmpty({ message: 'La razón de cancelación es requerida' })
    @MaxLength(500, { message: 'La razón no puede exceder 500 caracteres' })
    reason: string;
}
