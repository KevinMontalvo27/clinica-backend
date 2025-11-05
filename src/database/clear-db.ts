// src/database/clear-db.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function clearDatabase() {
  console.log('🗑️  Limpiando base de datos...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);

    // Desactivar foreign key checks temporalmente
    await dataSource.query('SET session_replication_role = replica;');

    // Obtener todas las tablas
    const tables = await dataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    console.log(`📋 Tablas encontradas: ${tables.length}\n`);

    // Eliminar datos de cada tabla
    for (const { tablename } of tables) {
      if (tablename !== 'migrations') { // No limpiar tabla de migraciones
        try {
          await dataSource.query(`TRUNCATE TABLE "${tablename}" CASCADE;`);
          console.log(`   ✓ ${tablename} limpiada`);
        } catch (error) {
          console.log(`   ⚠ Error limpiando ${tablename}: ${error.message}`);
        }
      }
    }

    // Reactivar foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ Base de datos limpiada exitosamente\n');

  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
  } finally {
    await app.close();
  }
}

clearDatabase()
  .then(() => {
    console.log('🎉 Proceso de limpieza finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });