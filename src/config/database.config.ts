// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { registerAs } from '@nestjs/config';

export default registerAs(
    'database',
    (): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',    
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'clinica',
        entities: [
        __dirname + '/../**/*.entity{.ts,.js}' // ← Esto debería encontrar tus archivos
        ],
        synchronize: true,
        logging: false, 
    })
);