import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityCustom } from '../../shared/entities/base.entity';
import { Doctor } from '../../users/entities/doctor.entity';

@Entity('schedule_exceptions')
export class ScheduleException extends BaseEntityCustom {
    @ManyToOne(() => Doctor, doctor => doctor.scheduleExceptions)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column()
    doctorId: string;

    @Column({ type: 'date' })
    exceptionDate: Date;

    @Column({ type: 'time', nullable: true })
    startTime: string | null;

    @Column({ type: 'time', nullable: true })
    endTime: string | null;

    @Column({ type: 'text', nullable: true })
    reason: string;
}