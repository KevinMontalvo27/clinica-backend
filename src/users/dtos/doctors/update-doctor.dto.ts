import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDoctorDto } from './create-doctor.dto';
import { UpdateUserDto } from '../users/update-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDoctorDto extends PartialType(
    OmitType(CreateDoctorDto, ['user', 'licenseNumber'] as const)
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