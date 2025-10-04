import { Entity, Column, OneToOne, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntityCustom } from '../../shared/entities/base.entity';
import { User } from './users.entity';
import { Specialty } from './specialty.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { DoctorSchedule } from '../../appointments/entities/doctor-schedule.entity';
import { ScheduleException } from 'src/appointments/entities/schedule-exception.entity';
import { Consultation } from 'src/medical-records/entities/consultation.entity';
import { Service } from 'src/appointments/entities/service.entity';

@Entity('doctors')
export class Doctor extends BaseEntityCustom {
    @OneToOne(() => User, user => user.doctor, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Specialty, specialty => specialty.doctors)
    @JoinColumn({ name: 'specialtyId' })
    specialty: Specialty;

    @Column()
    specialtyId: string;

    @Column({ unique: true, length: 50 })
    licenseNumber: string;

    @Column({ nullable: true })
    yearsExperience: number;

    @Column({ type: 'text', nullable: true })
    education: string;

    @Column({ type: 'text', nullable: true })
    certifications: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    consultationPrice: number;

    @Column({ type: 'text', nullable: true })
    biography: string;

    @Column({ length: 500, nullable: true })
    profileImageUrl: string;

    @Column({ default: true })
    isAvailable: boolean;

    //RELACION CON APPOINTMENT
    @OneToMany(() => Appointment, appointment => appointment.doctor)
    appointments: Appointment[];

    //RELACION CON DOCTOR_SCHEDULE
    @OneToMany(() => DoctorSchedule, schedule => schedule.doctor)
    schedules: DoctorSchedule[];

    //RELACION CON SCHEDULE_EXCEPTION
    @OneToMany(() => ScheduleException, exception => exception.doctor)
    scheduleExceptions: ScheduleException[];

    //RELACION CON CONSULTATION
    @OneToMany(() => Consultation, consultation => consultation.doctor)
    consultations: Consultation[];

    //Relacion con Service
    @OneToMany(() => Service, service => service.doctor)
    services: Service[];
}