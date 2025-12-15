import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { PaymentsModule } from './payments/payments.module';
import { SharedModule } from './shared/shared.module';
import databaseConfig from './config/database.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
        
        if (!config) {
          throw new Error('Database configuration not found');
        }
        
        return config;
      },
    }),
    AuthModule, 
    UsersModule, 
    AppointmentsModule, 
    MedicalRecordsModule, 
    PaymentsModule, 
    SharedModule, AIModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
