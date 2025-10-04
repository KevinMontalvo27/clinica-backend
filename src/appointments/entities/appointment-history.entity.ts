import { BaseEntityCustom } from "src/shared/entities/base.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Appointment } from "./appointment.entity";
import { User } from "src/users/entities/users.entity";


@Entity('appointment_history')
export class AppointmentHistory extends BaseEntityCustom {
    @ManyToOne(() => Appointment, appointment => appointment.history)
    @JoinColumn({ name: 'appointmentId' })
    appointment: Appointment;

    @Column()
    appointmentId: string;

    //Fecha y hora anterior
    @Column({ type: 'date' })
    previousDate: Date;

    @Column({ type: 'time' })
    previousTime: string;

    //Nueva fecha y hora
    @Column({ type: 'date' })
    newDate: Date;

    @Column({ type: 'time' })
    newTime: string;

    //Estados anterior y nuevo
    @Column({ length: 20 })
    previousStatus: string; //SCHEDULED, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, RESCHEDULED

    @Column({ length: 20 })
    newStatus: string; //SCHEDULED, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, RESCHEDULED

    //Motivo
    @Column({ type: 'text', nullable: true })
    reason: string;

    //Quien realizo el cambio
    @ManyToOne(() => User)
    @JoinColumn({ name: 'changedById' })
    changedBy: User;

    @Column()
    changedById: string;

    //Fecha del cambio
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    changedAt: Date;    
}