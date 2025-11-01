import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ScheduleResponseDto {
    @ApiProperty({ description: 'ID del horario' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'ID del doctor' })
    @Expose()
    doctorId: string;

    @ApiProperty({ description: 'Día de la semana (0-6)' })
    @Expose()
    dayOfWeek: number;

    @ApiProperty({ description: 'Nombre del día', example: 'Lunes' })
    @Expose()
    dayName?: string;

    @ApiProperty({ description: 'Hora de inicio' })
    @Expose()
    startTime: string;

    @ApiProperty({ description: 'Hora de fin' })
    @Expose()
    endTime: string;

    @ApiProperty({ description: 'Estado activo' })
    @Expose()
    isActive: boolean;

    @ApiProperty({ description: 'Fecha de creación' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Última actualización' })
    @Expose()
    updatedAt: Date;
}