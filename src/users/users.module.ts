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
        // UsersController,
        UsersController,
        // RolesController,
        RolesController
    ],
    providers: [
        // UsersService,
        UsersService,
        // RolesService,
        RolesService
    ]
})
export class UsersModule {}
