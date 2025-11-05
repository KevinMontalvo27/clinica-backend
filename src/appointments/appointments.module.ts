import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { ScheduleException } from './entities/schedule-exception.entity';
import { AppointmentHistory } from './entities/appointment-history.entity';
import { Service } from './entities/service.entity';

import { AppointmentsController } from './controllers/appointments.controller';
import { DoctorSchedulesController } from './controllers/doctor-schedule.controller';
import { ScheduleExceptionsController } from './controllers/schedule-exceptions.controller';
import { AvailabilityController } from './controllers/availability.controller';
import { ServicesController } from './controllers/services.controller';

import { AppointmentsService } from './services/appointments.service';
import { DoctorSchedulesService } from './services/doctor-schedules.service';
import { ScheduleExceptionsService } from './services/schedule-exceptions.service';
import { AvailabilityService } from './services/availability.service';
import { ServicesService } from './services/services.service';

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
  controllers: [
    AppointmentsController,
    DoctorSchedulesController,
    ScheduleExceptionsController,
    AvailabilityController,
    ServicesController,
  ],
  providers: [
    AppointmentsService,
    DoctorSchedulesService,
    ScheduleExceptionsService,
    AvailabilityService,
    ServicesService,
  ],
  exports: [
    AppointmentsService,
    DoctorSchedulesService,
    ScheduleExceptionsService,
    AvailabilityService,
    ServicesService,
  ]
})
export class AppointmentsModule {}