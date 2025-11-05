import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentHistory } from '../entities/appointment-history.entity';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { UpdateAppointmentDto } from '../dtos/update-appointment.dto';
import { UpdateAppointmentStatusDto, AppointmentStatus } from '../dtos/update-appointment-status.dto';
import { RescheduleAppointmentDto } from '../dtos/reschedule-appointment.dto';
import { CancelAppointmentDto } from '../dtos/cancel-appointment.dto';
import { AppointmentQueryDto } from '../dtos/appointment-query.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHistory)
    private readonly appointmentHistoryRepository: Repository<AppointmentHistory>,
  ) {}

  /**
   * Crea una nueva cita
   */
  async create(
    createAppointmentDto: CreateAppointmentDto,
    changedById?: string
  ): Promise<Appointment> {
    // Verificar disponibilidad del doctor
    const hasConflict = await this.checkScheduleConflict(
      createAppointmentDto.doctorId,
      createAppointmentDto.appointmentDate,
      createAppointmentDto.appointmentTime,
      createAppointmentDto.duration || 30
    );

    if (hasConflict) {
      throw new ConflictException('El doctor ya tiene una cita agendada en ese horario');
    }

    // Verificar que la fecha no sea en el pasado
    const appointmentDateTime = new Date(
      `${createAppointmentDto.appointmentDate}T${createAppointmentDto.appointmentTime}`
    );
    
    if (appointmentDateTime < new Date()) {
      throw new BadRequestException('No se puede agendar una cita en el pasado');
    }

    // Crear la cita
    const newAppointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      status: 'SCHEDULED',
    });

    const savedAppointment = await this.appointmentRepository.save(newAppointment);

    // Registrar en el historial
    if (changedById) {
      await this.createHistoryRecord(
        savedAppointment.id,
        null,
        null,
        createAppointmentDto.appointmentDate,
        createAppointmentDto.appointmentTime,
        null,
        'SCHEDULED',
        'Cita creada',
        changedById
      );
    }

    return await this.findById(savedAppointment.id);
  }

  /**
   * Obtiene todas las citas con filtros
   */
  async findAll(query: AppointmentQueryDto): Promise<[Appointment[], number]> {
    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .leftJoinAndSelect('appointment.service', 'service');

    if (query.doctorId) {
      qb.andWhere('appointment.doctorId = :doctorId', { doctorId: query.doctorId });
    }

    if (query.patientId) {
      qb.andWhere('appointment.patientId = :patientId', { patientId: query.patientId });
    }

    if (query.status) {
      qb.andWhere('appointment.status = :status', { status: query.status });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('appointment.appointmentDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      });
    } else if (query.startDate) {
      qb.andWhere('appointment.appointmentDate >= :startDate', { startDate: query.startDate });
    } else if (query.endDate) {
      qb.andWhere('appointment.appointmentDate <= :endDate', { endDate: query.endDate });
    }

    if (query.sortBy) {
      qb.orderBy(`appointment.${query.sortBy}`, query.order || 'ASC');
    } else {
      qb.orderBy('appointment.appointmentDate', 'ASC')
        .addOrderBy('appointment.appointmentTime', 'ASC');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    return await qb.getManyAndCount();
  }

  /**
   * Obtiene una cita por su ID
   */
  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: [
        'patient',
        'patient.user',
        'doctor',
        'doctor.user',
        'doctor.specialty',
        'service',
        'consultation',
        'history',
        'history.changedBy'
      ]
    });

    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    return appointment;
  }

  /**
   * Obtiene citas por doctor
   */
  async findByDoctor(
    doctorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Appointment[]> {
    const query: any = { doctorId };

    if (startDate && endDate) {
      query.appointmentDate = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      query.appointmentDate = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      query.appointmentDate = LessThanOrEqual(new Date(endDate));
    }

    return await this.appointmentRepository.find({
      where: query,
      relations: ['patient', 'patient.user', 'service'],
      order: { appointmentDate: 'ASC', appointmentTime: 'ASC' }
    });
  }

  /**
   * Obtiene citas por paciente
   */
  async findByPatient(
    patientId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Appointment[]> {
    const query: any = { patientId };

    if (startDate && endDate) {
      query.appointmentDate = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      query.appointmentDate = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      query.appointmentDate = LessThanOrEqual(new Date(endDate));
    }

    return await this.appointmentRepository.find({
      where: query,
      relations: ['doctor', 'doctor.user', 'doctor.specialty', 'service'],
      order: { appointmentDate: 'ASC', appointmentTime: 'ASC' }
    });
  }

  /**
   * Obtiene citas por estado
   */
  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { status },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
      order: { appointmentDate: 'ASC', appointmentTime: 'ASC' }
    });
  }

  /**
   * Obtiene citas del día actual
   */
  async findToday(doctorId?: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const where: any = { appointmentDate: new Date(today) };
    if (doctorId) {
      where.doctorId = doctorId;
    }

    return await this.appointmentRepository.find({
      where,
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
      order: { appointmentTime: 'ASC' }
    });
  }

  /**
   * Obtiene citas próximas (siguientes 7 días)
   */
  async findUpcoming(patientId?: string, doctorId?: string): Promise<Appointment[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const where: any = {
      appointmentDate: Between(today, nextWeek),
      status: 'SCHEDULED'
    };

    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    return await this.appointmentRepository.find({
      where,
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user', 'doctor.specialty'],
      order: { appointmentDate: 'ASC', appointmentTime: 'ASC' }
    });
  }

  /**
   * Actualiza una cita
   */
  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    changedById?: string
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    
    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    // Verificar conflictos si se cambia fecha/hora
    if (updateAppointmentDto.appointmentDate || updateAppointmentDto.appointmentTime) {
      const newDate = updateAppointmentDto.appointmentDate || appointment.appointmentDate;
      const newTime = updateAppointmentDto.appointmentTime || appointment.appointmentTime;
      const duration = updateAppointmentDto.duration || appointment.duration;

      const hasConflict = await this.checkScheduleConflict(
        appointment.doctorId,
        newDate,
        newTime,
        duration,
        id
      );

      if (hasConflict) {
        throw new ConflictException('El doctor ya tiene una cita en ese horario');
      }
    }

    Object.assign(appointment, updateAppointmentDto);
    await this.appointmentRepository.save(appointment);

    return await this.findById(id);
  }

  /**
   * Actualiza el estado de una cita
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateAppointmentStatusDto,
    changedById: string
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    
    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    const previousStatus = appointment.status;
    appointment.status = updateStatusDto.status;
    await this.appointmentRepository.save(appointment);

    // Registrar en el historial
    await this.createHistoryRecord(
      id,
      appointment.appointmentDate,
      appointment.appointmentTime,
      appointment.appointmentDate,
      appointment.appointmentTime,
      previousStatus,
      updateStatusDto.status,
      updateStatusDto.reason || `Estado cambiado a ${updateStatusDto.status}`,
      changedById
    );

    return await this.findById(id);
  }

  /**
   * Reagenda una cita
   */
  async reschedule(
    id: string,
    rescheduleDto: RescheduleAppointmentDto,
    changedById: string
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    
    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    // Verificar conflictos
    const hasConflict = await this.checkScheduleConflict(
      appointment.doctorId,
      rescheduleDto.newDate,
      rescheduleDto.newTime,
      appointment.duration,
      id
    );

    if (hasConflict) {
      throw new ConflictException('El doctor ya tiene una cita en ese horario');
    }

    const previousDate = appointment.appointmentDate;
    const previousTime = appointment.appointmentTime;
    const previousStatus = appointment.status;

    appointment.appointmentDate = rescheduleDto.newDate;
    appointment.appointmentTime = rescheduleDto.newTime;
    appointment.status = 'RESCHEDULED';

    await this.appointmentRepository.save(appointment);

    // Registrar en el historial
    await this.createHistoryRecord(
      id,
      previousDate,
      previousTime,
      rescheduleDto.newDate,
      rescheduleDto.newTime,
      previousStatus,
      'RESCHEDULED',
      rescheduleDto.reason || 'Cita reagendada',
      changedById
    );

    return await this.findById(id);
  }

  /**
   * Cancela una cita
   */
  async cancel(
    id: string,
    cancelDto: CancelAppointmentDto,
    changedById: string
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    
    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('La cita ya está cancelada');
    }

    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('No se puede cancelar una cita completada');
    }

    const previousStatus = appointment.status;
    appointment.status = 'CANCELLED';
    await this.appointmentRepository.save(appointment);

    // Registrar en el historial
    await this.createHistoryRecord(
      id,
      appointment.appointmentDate,
      appointment.appointmentTime,
      appointment.appointmentDate,
      appointment.appointmentTime,
      previousStatus,
      'CANCELLED',
      cancelDto.reason,
      changedById
    );

    return await this.findById(id);
  }

  /**
   * Confirma una cita
   */
  async confirm(id: string, changedById: string): Promise<Appointment> {
    return await this.updateStatus(
      id,
      { status: AppointmentStatus.CONFIRMED, reason: 'Cita confirmada' },
      changedById
    );
  }

  /**
   * Marca una cita como completada
   */
  async complete(id: string, changedById: string): Promise<Appointment> {
    return await this.updateStatus(
      id,
      { status: AppointmentStatus.COMPLETED, reason: 'Cita completada' },
      changedById
    );
  }

  /**
   * Marca una cita como "no se presentó"
   */
  async markAsNoShow(id: string, changedById: string): Promise<Appointment> {
    return await this.updateStatus(
      id,
      { status: AppointmentStatus.NO_SHOW, reason: 'Paciente no se presentó' },
      changedById
    );
  }

  /**
   * Elimina una cita
   */
  async delete(id: string): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    
    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    await this.appointmentRepository.remove(appointment);
  }

  /**
   * Verifica si hay conflicto de horario
   */
  private async checkScheduleConflict(
    doctorId: string,
    date: Date,
    time: string,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.appointmentDate = :date', { date })
      .andWhere('appointment.status NOT IN (:...statuses)', {
        statuses: ['CANCELLED', 'NO_SHOW']
      });

    if (excludeAppointmentId) {
      qb.andWhere('appointment.id != :excludeId', { excludeId: excludeAppointmentId });
    }

    const existingAppointments = await qb.getMany();

    const [hours, minutes] = time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;

    for (const existing of existingAppointments) {
      const [exHours, exMinutes] = existing.appointmentTime.split(':').map(Number);
      const exStartMinutes = exHours * 60 + exMinutes;
      const exEndMinutes = exStartMinutes + existing.duration;

      if (
        (startMinutes >= exStartMinutes && startMinutes < exEndMinutes) ||
        (endMinutes > exStartMinutes && endMinutes <= exEndMinutes) ||
        (startMinutes <= exStartMinutes && endMinutes >= exEndMinutes)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
 * Crea un registro en el historial de citas
 */
private async createHistoryRecord(
  appointmentId: string,
  previousDate: Date | null,
  previousTime: string | null,
  newDate: Date,
  newTime: string,
  previousStatus: string | null,
  newStatus: string,
  reason: string,
  changedById: string
): Promise<void> {
  const history = this.appointmentHistoryRepository.create({
    appointmentId,
    previousDate,
    previousTime,
    newDate,
    newTime,
    previousStatus,
    newStatus,
    reason,
    changedById,
  } as any);

  await this.appointmentHistoryRepository.save(history);
}

  /**
   * Obtiene el historial de una cita
   */
  async getHistory(appointmentId: string): Promise<AppointmentHistory[]> {
    return await this.appointmentHistoryRepository.find({
      where: { appointmentId },
      relations: ['changedBy'],
      order: { changedAt: 'DESC' }
    });
  }

  /**
   * Cuenta citas por estado
   */
  async countByStatus(
    doctorId?: string,
    patientId?: string
  ): Promise<Record<string, number>> {
    const where: any = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    const statuses = ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED'];
    const counts: Record<string, number> = {};

    for (const status of statuses) {
      counts[status] = await this.appointmentRepository.count({
        where: { ...where, status }
      });
    }

    return counts;
  }

  /**
   * Obtiene estadísticas de citas
   */
  async getStatistics(doctorId?: string, patientId?: string): Promise<any> {
    const where: any = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    const total = await this.appointmentRepository.count({ where });
    const statusCounts = await this.countByStatus(doctorId, patientId);

    return {
      total,
      byStatus: statusCounts,
      completionRate: total > 0 
        ? ((statusCounts.COMPLETED / total) * 100).toFixed(2) + '%'
        : '0%',
      cancellationRate: total > 0
        ? ((statusCounts.CANCELLED / total) * 100).toFixed(2) + '%'
        : '0%',
      noShowRate: total > 0
        ? ((statusCounts.NO_SHOW / total) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}