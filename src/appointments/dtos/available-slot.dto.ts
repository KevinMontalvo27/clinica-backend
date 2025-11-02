import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AvailableSlotResponseDto {
    @ApiProperty({ description: 'Hora del slot disponible', example: '09:00' })
    @Expose()
    time: string;

    @ApiProperty({ description: 'Si el slot está disponible' })
    @Expose()
    available: boolean;

    @ApiProperty({ description: 'Duración del slot en minutos' })
    @Expose()
    duration: number;
}