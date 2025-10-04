import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './entities/consultation.entity';
import { MedicalRecord } from './entities/medical-record.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Consultation,
            MedicalRecord,
        ])
    ],
})
export class MedicalRecordsModule {}
