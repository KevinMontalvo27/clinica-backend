import {Entity, Column, ManyToOne, JoinColumn, OneToOne, OneToMany} from 'typeorm';
import {BaseEntityCustom} from '../../shared/entities/base.entity';
import {Doctor} from '../../users/entities/doctor.entity';
import {Patient} from '../../users/entities/patient.entity';
import { Consultation } from '../../medical-records/entities/consultation.entity';
import { AppointmentHistory } from './appointment-history.entity';
import { Service } from './service.entity';

@Entity('appointments')
export class Appointment extends BaseEntityCustom {
    @Column({type: 'date'})
    appointmentDate: Date;

    @Column({type: 'time'})
    appointmentTime: string;

    @Column({default: 30})
    duration: number;

    @Column({length: 20, default: 'scheduled'})
    status: string; //SCHEDULED, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, RESCHEDULED

    @Column({type: 'text', nullable: true})
    reasonForVisit: string;

    @Column({type: 'text', nullable: true})
    notes: string;

    @Column({type: 'decimal', precision:10, scale: 2, nullable: true})
    price: number;

    //RELACION CON PATIENT
    @ManyToOne(() => Patient, patient => patient.appointments)
    @JoinColumn({name: 'patientId'})
    patient: Patient;

    @Column()
    patientId: string;

    //RELACION CON DOCTOR
    @ManyToOne(() => Doctor, doctor => doctor.appointments)
    @JoinColumn({name: 'doctorId'})
    doctor: Doctor;

    @Column()
    doctorId: string;

    @OneToOne(() => Consultation, consultation => consultation.appointment)
    consultation: Consultation;

    @OneToMany(() => AppointmentHistory, history => history.appointment)
    history: AppointmentHistory[];

    @ManyToOne(() => Service)
    @JoinColumn({ name: 'serviceId' })
    service: Service;

    @Column({ nullable: true })
    serviceId: string;
}