// src/database/seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RolesService } from '../users/services/roles.service';
import { SpecialtiesService } from '../users/services/specialties.service';
import { UsersService } from '../users/services/users.service';
import { DoctorsService } from '../users/services/doctors.service';
import { PatientsService } from '../users/services/patients.service';
import { DoctorSchedulesService } from '../appointments/services/doctor-schedules.service';
import { ServicesService } from '../appointments/services/services.service';
import { AppointmentsService } from '../appointments/services/appointments.service';

// Importa las entidades para tipar correctamente
import { Doctor } from '../users/entities/doctor.entity';
import { Patient } from '../users/entities/patient.entity';
import { Specialty } from '../users/entities/specialty.entity';

async function seed() {
  console.log('Iniciando seed de la base de datos...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Servicios
    const rolesService = app.get(RolesService);
    const specialtiesService = app.get(SpecialtiesService);
    const usersService = app.get(UsersService);
    const doctorsService = app.get(DoctorsService);
    const patientsService = app.get(PatientsService);
    const schedulesService = app.get(DoctorSchedulesService);
    const servicesService = app.get(ServicesService);
    const appointmentsService = app.get(AppointmentsService);

    // ===========================================
    // 1. ROLES (Ya se crean automáticamente)
    // ===========================================
    console.log('✅ Roles creados automáticamente\n');

    // Obtener IDs de roles
    const adminRole = await rolesService.findByName('ADMIN');
    const doctorRole = await rolesService.findByName('DOCTOR');
    const patientRole = await rolesService.findByName('PATIENT');

    // ===========================================
    // 2. ESPECIALIDADES
    // ===========================================
    console.log('📚 Creando especialidades...');
    
    const specialties = [
      {
        name: 'Cardiología',
        description: 'Especialista en enfermedades del corazón y sistema cardiovascular',
        consultationDuration: 30,
        basePrice: 800
      },
      {
        name: 'Pediatría',
        description: 'Atención médica de bebés, niños y adolescentes',
        consultationDuration: 20,
        basePrice: 500
      },
      {
        name: 'Dermatología',
        description: 'Diagnóstico y tratamiento de enfermedades de la piel',
        consultationDuration: 25,
        basePrice: 600
      },
      {
        name: 'Oftalmología',
        description: 'Cuidado de los ojos y tratamiento de problemas visuales',
        consultationDuration: 20,
        basePrice: 550
      },
      {
        name: 'Medicina General',
        description: 'Atención médica integral para adultos',
        consultationDuration: 30,
        basePrice: 400
      },
      {
        name: 'Ginecología',
        description: 'Salud reproductiva y atención de la mujer',
        consultationDuration: 30,
        basePrice: 700
      },
      {
        name: 'Traumatología',
        description: 'Tratamiento de lesiones del sistema musculoesquelético',
        consultationDuration: 25,
        basePrice: 650
      },
      {
        name: 'Neurología',
        description: 'Diagnóstico y tratamiento de enfermedades del sistema nervioso',
        consultationDuration: 40,
        basePrice: 900
      }
    ];

    const createdSpecialties: Specialty[] = []; // ✅ Tipar el array
    for (const specialty of specialties) {
      try {
        const created = await specialtiesService.create(specialty);
        createdSpecialties.push(created);
        console.log(`   ✓ ${specialty.name}`);
      } catch (error) {
        console.log(`   ⚠ ${specialty.name} (ya existe)`);
        const existing = await specialtiesService.findByName(specialty.name);
        createdSpecialties.push(existing);
      }
    }
    console.log('');

    // ===========================================
    // 3. USUARIOS ADMIN
    // ===========================================
    console.log('👤 Creando usuarios administradores...');
    
    const admins = [
      {
        email: 'admin@clinica.com',
        password: 'Admin123!',
        firstName: 'Carlos',
        lastName: 'Administrador',
        phone: '+52 668 111 1111',
        roleId: adminRole.id
      }
    ];

    for (const admin of admins) {
      try {
        await usersService.create(admin);
        console.log(`   ✓ ${admin.email}`);
      } catch (error) {
        console.log(`   ⚠ ${admin.email} (ya existe)`);
      }
    }
    console.log('');

    // ===========================================
    // 4. DOCTORES
    // ===========================================
    console.log('👨‍⚕️ Creando doctores...');
    
    const doctors = [
      {
        user: {
          email: 'garcia.cardio@clinica.com',
          password: 'Doctor123!',
          firstName: 'Roberto',
          lastName: 'García Hernández',
          phone: '+52 668 222 2222',
          dateOfBirth: new Date('1975-03-15'),
          gender: 'MALE',
          address: 'Av. Reforma 123, Los Mochis',
          roleId: doctorRole.id
        },
        specialtyId: createdSpecialties[0].id, // Cardiología
        licenseNumber: '1234567',
        yearsExperience: 15,
        education: 'Universidad Nacional Autónoma de México - Especialidad en Cardiología',
        certifications: 'Certificado por el Consejo Mexicano de Cardiología',
        consultationPrice: 850,
        biography: 'Especialista en cardiología con más de 15 años de experiencia en diagnóstico y tratamiento de enfermedades cardiovasculares.'
      },
      {
        user: {
          email: 'martinez.pediatra@clinica.com',
          password: 'Doctor123!',
          firstName: 'Ana María',
          lastName: 'Martínez López',
          phone: '+52 668 333 3333',
          dateOfBirth: new Date('1982-07-22'),
          gender: 'FEMALE',
          address: 'Calle Juárez 456, Los Mochis',
          roleId: doctorRole.id
        },
        specialtyId: createdSpecialties[1].id, // Pediatría
        licenseNumber: '2345678',
        yearsExperience: 10,
        education: 'Instituto Politécnico Nacional - Pediatría',
        certifications: 'Certificada en Pediatría General',
        consultationPrice: 550,
        biography: 'Pediatra dedicada al cuidado integral de niños y adolescentes con enfoque en medicina preventiva.'
      },
      {
        user: {
          email: 'lopez.dermatologo@clinica.com',
          password: 'Doctor123!',
          firstName: 'Luis',
          lastName: 'López Ramírez',
          phone: '+52 668 444 4444',
          dateOfBirth: new Date('1978-11-30'),
          gender: 'MALE',
          address: 'Blvd. Castro 789, Los Mochis',
          roleId: doctorRole.id
        },
        specialtyId: createdSpecialties[2].id, // Dermatología
        licenseNumber: '3456789',
        yearsExperience: 12,
        education: 'Universidad de Guadalajara - Dermatología',
        consultationPrice: 650,
        biography: 'Experto en tratamiento de enfermedades de la piel y procedimientos dermatológicos.'
      },
      {
        user: {
          email: 'rodriguez.oftalmo@clinica.com',
          password: 'Doctor123!',
          firstName: 'Patricia',
          lastName: 'Rodríguez Sánchez',
          phone: '+52 668 555 5555',
          dateOfBirth: new Date('1985-05-18'),
          gender: 'FEMALE',
          address: 'Av. Independencia 321, Los Mochis',
          roleId: doctorRole.id
        },
        specialtyId: createdSpecialties[3].id, // Oftalmología
        licenseNumber: '4567890',
        yearsExperience: 8,
        education: 'Universidad Autónoma de Sinaloa - Oftalmología',
        consultationPrice: 600,
        biography: 'Oftalmóloga especializada en cirugía refractiva y enfermedades oculares.'
      },
      {
        user: {
          email: 'sanchez.general@clinica.com',
          password: 'Doctor123!',
          firstName: 'Miguel',
          lastName: 'Sánchez Torres',
          phone: '+52 668 666 6666',
          dateOfBirth: new Date('1980-09-12'),
          gender: 'MALE',
          address: 'Calle Hidalgo 654, Los Mochis',
          roleId: doctorRole.id
        },
        specialtyId: createdSpecialties[4].id, // Medicina General
        licenseNumber: '5678901',
        yearsExperience: 14,
        education: 'Universidad Autónoma de Sinaloa - Medicina General',
        consultationPrice: 450,
        biography: 'Médico general con amplia experiencia en atención primaria y medicina preventiva.'
      },
      {
        user: {
          email: 'fernandez.gineco@clinica.com',
          password: 'Doctor123!',
          firstName: 'Carmen',
          lastName: 'Fernández Díaz',
          phone: '+52 668 777 7777',
          dateOfBirth: new Date('1977-12-08'),
          gender: 'FEMALE',
          address: 'Av. Rosales 987, Los Mochis',
          roleId: doctorRole.id
        },
        specialtyId: createdSpecialties[5].id, // Ginecología
        licenseNumber: '6789012',
        yearsExperience: 16,
        education: 'UNAM - Ginecología y Obstetricia',
        consultationPrice: 750,
        biography: 'Ginecóloga con especialidad en medicina materno-fetal y cirugía ginecológica.'
      },
      {
        user: {
          email: 'torres.traumatologo@clinica.com',
          password: 'Doctor123!',
          firstName: 'Jorge',
          lastName: 'Torres Mendoza',
          phone: '+52 668 888 8888',
          dateOfBirth: new Date('1983-04-25'),
          gender: 'MALE',
          address: 'Calle Zaragoza 135, Los Mochis',
          roleId: doctorRole.id
        },
        specialtyId: createdSpecialties[6].id, // Traumatología
        licenseNumber: '7890123',
        yearsExperience: 11,
        education: 'Universidad de Monterrey - Traumatología y Ortopedia',
        consultationPrice: 700,
        biography: 'Traumatólogo especializado en cirugía de rodilla y lesiones deportivas.'
      },
      {
        user: {
          email: 'ramirez.neurologo@clinica.com',
          password: 'Doctor123!',
          firstName: 'Isabel',
          lastName: 'Ramírez Castro',
          phone: '+52 668 999 9999',
          dateOfBirth: new Date('1979-08-14'),
          gender: 'FEMALE',
          address: 'Blvd. Macario Gaxiola 246, Los Mochis',
          roleId: doctorRole.id
        },
        specialtyId: createdSpecialties[7].id, // Neurología
        licenseNumber: '8901234',
        yearsExperience: 13,
        education: 'Instituto Nacional de Neurología - Neurología Clínica',
        consultationPrice: 950,
        biography: 'Neuróloga experta en trastornos neurológicos y enfermedades neurodegenerativas.'
      }
    ];

    const createdDoctors: Doctor[] = []; // ✅ Tipar el array
    for (const doctor of doctors) {
      try {
        const created = await doctorsService.create(doctor);
        createdDoctors.push(created);
        console.log(`   ✓ Dr. ${doctor.user.firstName} ${doctor.user.lastName}`);
      } catch (error) {
        console.log(`   ⚠ Dr. ${doctor.user.firstName} ${doctor.user.lastName} (error: ${error.message})`);
      }
    }
    console.log('');

    // ===========================================
    // 5. HORARIOS DE DOCTORES
    // ===========================================
    console.log('🕐 Creando horarios de doctores...');
    
    for (const doctor of createdDoctors) {
      const schedules = [
        // Lunes a Viernes: 9:00 - 13:00
        { doctorId: doctor.id, dayOfWeek: 1, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        { doctorId: doctor.id, dayOfWeek: 2, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        { doctorId: doctor.id, dayOfWeek: 3, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        { doctorId: doctor.id, dayOfWeek: 4, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        { doctorId: doctor.id, dayOfWeek: 5, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        // Lunes a Viernes: 16:00 - 19:00
        { doctorId: doctor.id, dayOfWeek: 1, startTime: '16:00:00', endTime: '19:00:00', isActive: true },
        { doctorId: doctor.id, dayOfWeek: 2, startTime: '16:00:00', endTime: '19:00:00', isActive: true },
        { doctorId: doctor.id, dayOfWeek: 3, startTime: '16:00:00', endTime: '19:00:00', isActive: true },
        { doctorId: doctor.id, dayOfWeek: 4, startTime: '16:00:00', endTime: '19:00:00', isActive: true },
        { doctorId: doctor.id, dayOfWeek: 5, startTime: '16:00:00', endTime: '19:00:00', isActive: true },
        // Sábado: 9:00 - 13:00
        { doctorId: doctor.id, dayOfWeek: 6, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
      ];

      try {
        await schedulesService.createBulk(schedules);
        const doctorUser = doctor.user || { firstName: 'Doctor', lastName: '' };
        console.log(`   ✓ Horarios para Dr. ${doctorUser.firstName} ${doctorUser.lastName}`);
      } catch (error) {
        const doctorUser = doctor.user || { firstName: 'Doctor' };
        console.log(`   ⚠ Error creando horarios para Dr. ${doctorUser.firstName}`);
      }
    }
    console.log('');

    // ===========================================
    // 6. SERVICIOS MÉDICOS
    // ===========================================
    console.log('💊 Creando servicios médicos...');
    
    for (const doctor of createdDoctors) {
      const services = [
        {
          doctorId: doctor.id,
          name: 'Consulta General',
          description: 'Consulta médica general',
          price: doctor.consultationPrice || 500,
          duration: 30,
          isActive: true
        },
        {
          doctorId: doctor.id,
          name: 'Consulta de Seguimiento',
          description: 'Seguimiento de tratamiento',
          price: (doctor.consultationPrice || 500) * 0.8,
          duration: 20,
          isActive: true
        },
        {
          doctorId: doctor.id,
          name: 'Consulta de Urgencia',
          description: 'Atención de urgencias',
          price: (doctor.consultationPrice || 500) * 1.5,
          duration: 30,
          isActive: true
        }
      ];

      try {
        for (const service of services) {
          await servicesService.create(service);
        }
        const doctorUser = doctor.user || { firstName: 'Doctor', lastName: '' };
        console.log(`   ✓ Servicios para Dr. ${doctorUser.firstName} ${doctorUser.lastName}`);
      } catch (error) {
        const doctorUser = doctor.user || { firstName: 'Doctor' };
        console.log(`   ⚠ Error creando servicios para Dr. ${doctorUser.firstName}`);
      }
    }
    console.log('');

    // ===========================================
    // 7. PACIENTES
    // ===========================================
    console.log('🧑‍🤝‍🧑 Creando pacientes...');
    
    const patients = [
      {
        user: {
          email: 'juan.perez@email.com',
          password: 'Patient123!',
          firstName: 'Juan',
          lastName: 'Pérez González',
          phone: '+52 668 100 0001',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'MALE',
          address: 'Calle Luna 100, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'María Pérez',
        emergencyContactPhone: '+52 668 100 0002',
        insuranceProvider: 'IMSS',
        insuranceNumber: '12345678901',
        bloodType: 'O+'
      },
      {
        user: {
          email: 'maria.lopez@email.com',
          password: 'Patient123!',
          firstName: 'María',
          lastName: 'López Martínez',
          phone: '+52 668 100 0003',
          dateOfBirth: new Date('1985-08-22'),
          gender: 'FEMALE',
          address: 'Av. Sol 200, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Pedro López',
        emergencyContactPhone: '+52 668 100 0004',
        insuranceProvider: 'ISSSTE',
        insuranceNumber: '98765432109',
        bloodType: 'A+'
      },
      {
        user: {
          email: 'carlos.rodriguez@email.com',
          password: 'Patient123!',
          firstName: 'Carlos',
          lastName: 'Rodríguez Silva',
          phone: '+52 668 100 0005',
          dateOfBirth: new Date('1978-12-10'),
          gender: 'MALE',
          address: 'Blvd. Estrella 300, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Ana Rodríguez',
        emergencyContactPhone: '+52 668 100 0006',
        bloodType: 'B+'
      },
      {
        user: {
          email: 'ana.martinez@email.com',
          password: 'Patient123!',
          firstName: 'Ana',
          lastName: 'Martínez Hernández',
          phone: '+52 668 100 0007',
          dateOfBirth: new Date('1992-03-28'),
          gender: 'FEMALE',
          address: 'Calle Cielo 400, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Luis Martínez',
        emergencyContactPhone: '+52 668 100 0008',
        insuranceProvider: 'Seguro Popular',
        insuranceNumber: '55555555555',
        bloodType: 'AB+'
      },
      {
        user: {
          email: 'pedro.sanchez@email.com',
          password: 'Patient123!',
          firstName: 'Pedro',
          lastName: 'Sánchez Gómez',
          phone: '+52 668 100 0009',
          dateOfBirth: new Date('1995-07-05'),
          gender: 'MALE',
          address: 'Av. Mar 500, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Rosa Sánchez',
        emergencyContactPhone: '+52 668 100 0010',
        bloodType: 'O-'
      },
      {
        user: {
          email: 'laura.garcia@email.com',
          password: 'Patient123!',
          firstName: 'Laura',
          lastName: 'García Ramírez',
          phone: '+52 668 100 0011',
          dateOfBirth: new Date('1988-11-18'),
          gender: 'FEMALE',
          address: 'Calle Rio 600, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Jorge García',
        emergencyContactPhone: '+52 668 100 0012',
        insuranceProvider: 'GNP',
        insuranceNumber: '77777777777',
        bloodType: 'A-'
      },
      {
        user: {
          email: 'roberto.fernandez@email.com',
          password: 'Patient123!',
          firstName: 'Roberto',
          lastName: 'Fernández Torres',
          phone: '+52 668 100 0013',
          dateOfBirth: new Date('1982-04-30'),
          gender: 'MALE',
          address: 'Blvd. Valle 700, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Carmen Fernández',
        emergencyContactPhone: '+52 668 100 0014',
        bloodType: 'B-'
      },
      {
        user: {
          email: 'sofia.diaz@email.com',
          password: 'Patient123!',
          firstName: 'Sofía',
          lastName: 'Díaz Morales',
          phone: '+52 668 100 0015',
          dateOfBirth: new Date('1998-09-12'),
          gender: 'FEMALE',
          address: 'Av. Montaña 800, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Miguel Díaz',
        emergencyContactPhone: '+52 668 100 0016',
        insuranceProvider: 'Metlife',
        insuranceNumber: '99999999999',
        bloodType: 'O+'
      },
      {
        user: {
          email: 'diego.castro@email.com',
          password: 'Patient123!',
          firstName: 'Diego',
          lastName: 'Castro Vargas',
          phone: '+52 668 100 0017',
          dateOfBirth: new Date('1987-01-20'),
          gender: 'MALE',
          address: 'Calle Bosque 900, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Patricia Castro',
        emergencyContactPhone: '+52 668 100 0018',
        bloodType: 'A+'
      },
      {
        user: {
          email: 'valentina.ruiz@email.com',
          password: 'Patient123!',
          firstName: 'Valentina',
          lastName: 'Ruiz Mendoza',
          phone: '+52 668 100 0019',
          dateOfBirth: new Date('1993-06-08'),
          gender: 'FEMALE',
          address: 'Blvd. Lago 1000, Los Mochis',
          roleId: patientRole.id
        },
        emergencyContactName: 'Fernando Ruiz',
        emergencyContactPhone: '+52 668 100 0020',
        insuranceProvider: 'IMSS',
        insuranceNumber: '11111111111',
        bloodType: 'AB-'
      }
    ];

    const createdPatients: Patient[] = []; // ✅ Tipar el array
    for (const patient of patients) {
      try {
        const created = await patientsService.create(patient);
        createdPatients.push(created);
        console.log(`   ✓ ${patient.user.firstName} ${patient.user.lastName}`);
      } catch (error) {
        console.log(`   ⚠ ${patient.user.firstName} ${patient.user.lastName} (error: ${error.message})`);
      }
    }
    console.log('');

    // ===========================================
    // 8. CITAS
    // ===========================================
    console.log('📅 Creando citas...');
    
    // Obtener fecha de hoy y los próximos días
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const appointments = [
      // Citas de hoy
      {
        appointmentDate: today,
        appointmentTime: '10:00',
        duration: 30,
        reasonForVisit: 'Revisión de presión arterial',
        notes: 'Paciente con historial de hipertensión',
        price: 800,
        patientId: createdPatients[0]?.id,
        doctorId: createdDoctors[0]?.id, // Cardiólogo
      },
      {
        appointmentDate: today,
        appointmentTime: '11:00',
        duration: 30,
        reasonForVisit: 'Consulta general pediátrica',
        notes: 'Niño de 5 años con resfriado',
        price: 500,
        patientId: createdPatients[1]?.id,
        doctorId: createdDoctors[1]?.id, // Pediatra
      },
      // Citas de mañana
      {
        appointmentDate: tomorrow,
        appointmentTime: '09:00',
        duration: 30,
        reasonForVisit: 'Revisión dermatológica',
        notes: 'Manchas en la piel',
        price: 600,
        patientId: createdPatients[2]?.id,
        doctorId: createdDoctors[2]?.id, // Dermatólogo
      },
      {
        appointmentDate: tomorrow,
        appointmentTime: '16:00',
        duration: 20,
        reasonForVisit: 'Examen de la vista',
        notes: 'Dificultad para ver de cerca',
        price: 550,
        patientId: createdPatients[3]?.id,
        doctorId: createdDoctors[3]?.id, // Oftalmólogo
      },
      // Citas de la próxima semana
      {
        appointmentDate: nextWeek,
        appointmentTime: '10:30',
        duration: 30,
        reasonForVisit: 'Chequeo general',
        notes: 'Revisión anual',
        price: 400,
        patientId: createdPatients[4]?.id,
        doctorId: createdDoctors[4]?.id, // Medicina General
      },
      {
        appointmentDate: nextWeek,
        appointmentTime: '11:00',
        duration: 30,
        reasonForVisit: 'Control prenatal',
        notes: 'Semana 20 de embarazo',
        price: 700,
        patientId: createdPatients[5]?.id,
        doctorId: createdDoctors[5]?.id, // Ginecóloga
      },
      {
        appointmentDate: nextWeek,
        appointmentTime: '16:30',
        duration: 25,
        reasonForVisit: 'Dolor en rodilla',
        notes: 'Posible lesión deportiva',
        price: 650,
        patientId: createdPatients[6]?.id,
        doctorId: createdDoctors[6]?.id, // Traumatólogo
      },
      {
        appointmentDate: nextWeek,
        appointmentTime: '17:00',
        duration: 40,
        reasonForVisit: 'Dolores de cabeza frecuentes',
        notes: 'Migrañas recurrentes',
        price: 900,
        patientId: createdPatients[7]?.id,
        doctorId: createdDoctors[7]?.id, // Neuróloga
      }
    ];

    for (const appointment of appointments) {
      if (appointment.patientId && appointment.doctorId) {
        try {
          await appointmentsService.create(appointment, 'system');
          console.log(`   ✓ Cita creada para ${appointment.appointmentDate.toLocaleDateString()}`);
        } catch (error) {
          console.log(`   ⚠ Error creando cita: ${error.message}`);
        }
      }
    }
    console.log('');

    console.log('✅ ¡Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   • Especialidades: ${createdSpecialties.length}`);
    console.log(`   • Doctores: ${createdDoctors.length}`);
    console.log(`   • Pacientes: ${createdPatients.length}`);
    console.log('');
    console.log('🔑 Credenciales de prueba:');
    console.log('   Admin: admin@clinica.com / Admin123!');
    console.log('   Doctor: garcia.cardio@clinica.com / Doctor123!');
    console.log('   Paciente: juan.perez@email.com / Patient123!');
    console.log('');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await app.close();
  }
}

seed()
  .then(() => {
    console.log('🎉 Proceso de seed finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });