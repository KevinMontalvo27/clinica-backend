import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiService } from './services/gemini.service';
import { MedicalHistoryAIService } from './services/medical-history-ai.service';
import { MedicalHistoryController } from './medical-history.controller';
import { GeneratedMedicalHistory } from './generated-medical-history.entity';
import { UsersModule } from '../users/users.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { MedicalRecordsModule } from '../medical-records/medical-records.module';
import { PdfGeneratorService } from './services/pdf-generator.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([GeneratedMedicalHistory]),
    UsersModule,
    AppointmentsModule,
    MedicalRecordsModule,
  ],
  controllers: [MedicalHistoryController],
  providers: [GeminiService, MedicalHistoryAIService, PdfGeneratorService],
  exports: [GeminiService, MedicalHistoryAIService],
})
export class AIModule {}