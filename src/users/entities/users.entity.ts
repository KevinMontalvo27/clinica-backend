import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityCustom } from '../../shared/entities/base.entity';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Role } from './role.entity';

@Entity('users')
export class User extends BaseEntityCustom {
    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ length: 255 })
    passwordHash: string;

    @Column({ length: 100 })
    firstName: string;

    @Column({ length: 100 })
    lastName: string;

    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date;

    @Column({ length: 10, nullable: true })
    gender: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    emailVerified: boolean;

    @ManyToOne(() => Role, role => role.users)
    @JoinColumn({ name: 'roleId' })
    role: Role;

    @Column()
    roleId: string;

    @OneToOne(() => Doctor, doctor => doctor.user, { cascade: true, nullable: true })
    doctor: Doctor;

    @OneToOne(() => Patient, patient => patient.user, { cascade: true, nullable: true })
    patient: Patient;
}