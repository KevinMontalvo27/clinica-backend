import { BaseEntityCustom } from "src/shared/entities/base.entity";
import { Doctor } from "src/users/entities/doctor.entity";
import { Patient } from "src/users/entities/patient.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";


@Entity('medical_records')
export class MedicalRecord extends BaseEntityCustom {
    @ManyToOne(() => Patient, patient => patient.medicalRecords)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    patientId: string;

    @ManyToOne(() => Doctor)
    @JoinColumn({ name: 'created_by' })
    createdBy: Doctor;

    @Column()
    created_by: string;

    //Antecedentes medicos 
    @Column ({type: 'text', nullable: true})
    medicalHistory: string;

    @Column({type: 'text', nullable: true})
    familyHistory: string;

    //Alergias
    @Column({type: 'text', nullable: true})
    allergies: string;

    //Enfermedades cronicas
    @Column({type: 'text', nullable: true})
    chronicDiseases: string;

    //Medicamentos actuales
    @Column({type: 'text', nullable: true})
    currentMedications: string;

    //Informacion adicional
    @Column({type: 'text', nullable: true})
    notes: string;

}