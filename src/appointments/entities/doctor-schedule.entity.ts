import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityCustom } from '../../shared/entities/base.entity';
import { Doctor } from '../../users/entities/doctor.entity';

@Entity('doctor_schedules')
export class DoctorSchedule extends BaseEntityCustom {
    //RELACION CON DOCTOR
    @ManyToOne(() => Doctor, doctor => doctor.schedules)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column()
    doctorId: string;

    @Column({type: 'int'})
    dayOfWeek: number; // 0 (Domingo) to 6 (Sabado)

    @Column({ type: 'time' })
    startTime: string; // Formato HH:MM:SS

    @Column({ type: 'time' })
    endTime: string; // Formato HH:MM:SS

    @Column({ default: true})
    isActive: boolean;
}