import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { AppointmentStatus } from './update-appointment-status.dto';

class PatientInfo {
    @Expose()
    id: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    email: string;

    @Expose()
    phone?: string;
}

class DoctorInfo {
    @Expose()
    id: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    specialtyName: string;

    @Expose()
    licenseNumber: string;
}

class ServiceInfo {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    price: number;

    @Expose()
    duration: number;
}

@Exclude()
export class AppointmentResponseDto {
    @ApiProperty({ description: 'ID de la cita' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'Fecha de la cita' })
    @Expose()
    appointmentDate: Date;

    @ApiProperty({ description: 'Hora de la cita' })
    @Expose()
    appointmentTime: string;

    @ApiProperty({ description: 'Duración en minutos' })
    @Expose()
    duration: number;

    @ApiProperty({ description: 'Estado de la cita', enum: AppointmentStatus })
    @Expose()
    status: string;

    @ApiPropertyOptional({ description: 'Motivo de la visita' })
    @Expose()
    reasonForVisit?: string;

    @ApiPropertyOptional({ description: 'Notas adicionales' })
    @Expose()
    notes?: string;

    @ApiPropertyOptional({ description: 'Precio de la cita' })
    @Expose()
    price?: number;

    @ApiProperty({ description: 'Información del paciente', type: PatientInfo })
    @Expose()
    @Type(() => PatientInfo)
    patient: PatientInfo;

    @ApiProperty({ description: 'Información del doctor', type: DoctorInfo })
    @Expose()
    @Type(() => DoctorInfo)
    doctor: DoctorInfo;

    @ApiPropertyOptional({ description: 'Información del servicio', type: ServiceInfo })
    @Expose()
    @Type(() => ServiceInfo)
    service?: ServiceInfo;

    @ApiProperty({ description: 'Fecha de creación' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Última actualización' })
    @Expose()
    updatedAt: Date;
}