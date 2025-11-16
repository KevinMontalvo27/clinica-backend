import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateMedicalRecordDto } from './create-medical-record.dto';

export class UpdateMedicalRecordDto extends PartialType(
    OmitType(CreateMedicalRecordDto, ['patientId', 'created_by'] as const)
) {}