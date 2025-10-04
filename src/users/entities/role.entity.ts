import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntityCustom } from '../../shared/entities/base.entity';
import { User } from './users.entity';

@Entity('roles')
export class Role extends BaseEntityCustom {
    @Column({ unique: true, length: 50 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => User, user => user.role)
    users: User[];
}