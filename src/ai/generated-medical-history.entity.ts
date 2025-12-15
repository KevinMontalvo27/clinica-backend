import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityCustom } from '../shared/entities/base.entity';
import { Patient } from '../users/entities/patient.entity';
import { User } from '../users/entities/users.entity';


@Entity('generated_medical_histories')
export class GeneratedMedicalHistory extends BaseEntityCustom {
    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    patientId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'generatedBy' })
    generatedByUser: User;

    @Column()
    generatedBy: string;

    @Column({ type: 'text' })
    content: string; // Contenido del historial generado por IA

    @Column({ length: 20, default: 'markdown' })
    format: string; // markdown, html, pdf, json

    @Column({ length: 30, default: 'complete' })
    historyType: string; // complete, summary, chronological, by_systems

    @Column({ type: 'date', nullable: true })
    startDate: Date; // Fecha de inicio del rango de datos incluidos

    @Column({ type: 'date', nullable: true })
    endDate: Date; // Fecha de fin del rango de datos incluidos

    @Column({ default: true })
    includeVitalSigns: boolean;

    @Column({ default: true })
    includePrescriptions: boolean;

    @Column({ length: 5, default: 'es' })
    language: string; // es, en

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    generatedAt: Date;

    @Column({ type: 'int', nullable: true })
    tokensUsed: number; // Tracking de uso de tokens

    @Column({ type: 'text', nullable: true })
    notes: string; // Notas adicionales sobre la generación
}