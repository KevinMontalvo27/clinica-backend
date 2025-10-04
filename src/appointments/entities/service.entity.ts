import { BaseEntityCustom } from "src/shared/entities/base.entity";
import { Doctor } from "src/users/entities/doctor.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";


@Entity('services')
export class Service extends BaseEntityCustom {
    @ManyToOne(() => Doctor, doctor => doctor.services)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column()
    doctorId: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ default: 30 })
    duration: number; //Duracion en minutos

    @Column({ default: true })
    isActive: boolean;


}