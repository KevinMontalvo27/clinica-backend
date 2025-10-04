import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntityCustom } from '../../shared/entities/base.entity';
import { Doctor } from './doctor.entity';

@Entity('specialties')
export class Specialty extends BaseEntityCustom {
    @Column({ unique: true, length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: 30 })
    consultationDuration: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    basePrice: number;

    @OneToMany(() => Doctor, doctor => doctor.specialty)
    doctors: Doctor[];
}