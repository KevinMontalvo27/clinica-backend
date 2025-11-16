import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateConsultationDto } from './create-consultation.dto';

export class UpdateConsultationDto extends PartialType(
    OmitType(CreateConsultationDto, ['patientId', 'doctorId', 'appointmentId'] as const)
) {}