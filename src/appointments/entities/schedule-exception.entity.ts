import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityCustom } from '../../shared/entities/base.entity';
import { Doctor } from 'src/users/entities/doctor.entity';

@Entity('schedule_exceptions')
export class ScheduleException extends BaseEntityCustom {
    @ManyToOne(() => Doctor, doctor => doctor.scheduleExceptions)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;
}