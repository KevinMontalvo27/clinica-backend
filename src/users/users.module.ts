import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { Patient } from './entities/patient.entity';
import { Specialty } from './entities/specialty.entity';
import { User } from './entities/users.entity';
import { Role } from './entities/role.entity';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { DoctorsService } from './services/doctors.service';
import { DoctorsController } from './controllers/doctors.controller';
import { SpecialtiesController } from './controllers/specialties.controller';
import { PatientsController } from './controllers/patients.controller';
import { SpecialtiesService } from './services/specialties.service';
import { PatientsService } from './services/patients.service';

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
    controllers: [
        UsersController,
        RolesController,
        DoctorsController,
        SpecialtiesController,
        PatientsController,
    ],
    providers: [
        UsersService,
        RolesService,
        DoctorsService,
        SpecialtiesService,
        PatientsService,
    ],
    exports: [
        UsersService,
        RolesService,
        DoctorsService,
        SpecialtiesService,
        PatientsService,
    ]
})
export class UsersModule {}
