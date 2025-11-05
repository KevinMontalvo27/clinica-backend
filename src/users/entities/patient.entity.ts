import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntityCustom } from '../../shared/entities/base.entity';
import { User } from './users.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';
import { Consultation } from '../../medical-records/entities/consultation.entity';


@Entity('patients')
export class Patient extends BaseEntityCustom {
    @OneToOne(() => User, user => user.patient, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ length: 100, nullable: true })
    emergencyContactName: string;

    @Column({ length: 20, nullable: true })
    emergencyContactPhone: string;

    @Column({ length: 100, nullable: true })
    insuranceProvider: string;

    @Column({ length: 50, nullable: true })
    insuranceNumber: string;

    @Column({ length: 5, nullable: true })
    bloodType: string;

    //RELACION CON APPOINTMENT
    @OneToMany(() => Appointment, appointment => appointment.patient)
    appointments: Appointment[];

    //RELACION CON MEDICAL_RECORD
    @OneToMany(() => MedicalRecord, record => record.patient)
    medicalRecords: MedicalRecord[];

    //RELACION CON CONSULTATION
    @OneToMany(() => Consultation, consultation => consultation.patient)
    consultations: Consultation[];
}