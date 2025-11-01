import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(
    OmitType(CreateAppointmentDto, ['patientId', 'doctorId'] as const)
) {}