import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

export abstract class BaseEntityCustom extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}