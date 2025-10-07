import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';
import { UpdateUserDto } from '../users/update-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePatientDto extends PartialType(
    OmitType(CreatePatientDto, ['user'] as const)
) {
    @ApiPropertyOptional({ 
        description: 'Información del usuario a actualizar',
        type: UpdateUserDto
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateUserDto)
    user?: UpdateUserDto;
}