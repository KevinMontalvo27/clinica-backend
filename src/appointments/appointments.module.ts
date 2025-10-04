import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { ScheduleException } from './entities/schedule-exception.entity';
import { AppointmentHistory } from './entities/appointment-history.entity';
import { Service } from './entities/service.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Appointment,
            DoctorSchedule,
            ScheduleException,
            AppointmentHistory,
            Service,
        ])
    ],
})
export class AppointmentsModule {}
