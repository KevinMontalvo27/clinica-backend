import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './entities/consultation.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalRecordsController } from './controllers/medical-record.controller';
import { ConsultationsController } from './controllers/consultation.controller';
import { MedicalRecordsService } from './services/medical-record.service';
import { ConsultationsService } from './services/consultation.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Consultation,
            MedicalRecord,
        ])
    ],

    controllers: [MedicalRecordsController, ConsultationsController],

    providers: [MedicalRecordsService, ConsultationsService],

    exports: [MedicalRecordsService, ConsultationsService],
})
export class MedicalRecordsModule {}
