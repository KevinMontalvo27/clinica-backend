import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { Patient } from './entities/patient.entity';
import { Specialty } from './entities/specialty.entity';
import { User } from './entities/users.entity';
import { Role } from './entities/role.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Doctor,
            Patient,
            Specialty,
            User,
            Role,
        ])
    ],
})
export class UsersModule {}
