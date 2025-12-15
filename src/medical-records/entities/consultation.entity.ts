import { Appointment } from "../../appointments/entities/appointment.entity";
import { BaseEntityCustom } from "../../shared/entities/base.entity";
import { Doctor } from "../../users/entities/doctor.entity";
import { Patient } from "../../users/entities/patient.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";


@Entity('consultations')
export class Consultation extends BaseEntityCustom {
    @OneToOne(() => Appointment)
    @JoinColumn({ name: 'appointmentId' })
    appointment: Appointment;

    @Column({nullable: true})
    appointmentId: string;

    @ManyToOne(() => Patient, patient => patient.consultations)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    patientId: string;

    @ManyToOne(() => Doctor, doctor => doctor.consultations)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column()
    doctorId: string;

    //Signos vitales
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    weight: number; 

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    height: number;

    @Column({ type: 'int', nullable: true })
    bloodPressureSystolic: number; //Presion arterial sistolica

    @Column({ type: 'int', nullable: true })
    bloodPressureDiastolic: number; //Presion arterial diastolica

    @Column({ type: 'int', nullable: true })
    heartRate: number; //Frecuencia cardiaca

    @Column({ type: 'decimal', nullable: true })
    temperature: number; 

    //Consulta
    @Column({ type: 'text', nullable: true })
    chiefComplaint: string; //Motivo de consulta

    @Column({ type: 'text', nullable: true })
    symptoms: string; //Sintomas

    @Column({ type: 'text', nullable: true })
    diagnosis: string; //Diagnostico

    @Column({ type: 'text', nullable: true })
    treatmentPlan: string; //Plan de tratamiento

    @Column({ type: 'text', nullable: true })
    prescriptions: string; //Prescripciones

    @Column({ type: 'text', nullable: true })
    followUpInstructions: string; //Instrucciones de seguimiento

    //Archivos adjuntos
    @Column({ type: 'text', nullable: true })
    attachments: string; //URLs o paths a archivos adjuntos

    @Column({ type: 'text', nullable: true })
    notes: string; //Notas adicionales

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    consultationDate: Date;

}