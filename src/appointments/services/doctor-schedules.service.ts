import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { CreateScheduleDto } from '../dtos/create-schedule.dto';
import { UpdateScheduleDto } from '../dtos/update-schedule.dto';

@Injectable()
export class DoctorSchedulesService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepository: Repository<DoctorSchedule>,
  ) {}

  /**
   * Crea un nuevo horario para un doctor
   */
  async create(createScheduleDto: CreateScheduleDto): Promise<DoctorSchedule> {
    // Validar que startTime sea menor que endTime
    if (createScheduleDto.startTime >= createScheduleDto.endTime) {
      throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
    }

    // Verificar que no exista solapamiento de horarios para ese doctor en ese día
    const existingSchedules = await this.scheduleRepository.find({
      where: {
        doctorId: createScheduleDto.doctorId,
        dayOfWeek: createScheduleDto.dayOfWeek,
        isActive: true
      }
    });

    // Validar solapamiento
    for (const schedule of existingSchedules) {
      if (this.hasTimeOverlap(
        createScheduleDto.startTime,
        createScheduleDto.endTime,
        schedule.startTime,
        schedule.endTime
      )) {
        throw new ConflictException(
          `Ya existe un horario activo que se solapa con el rango especificado para este día`
        );
      }
    }

    const schedule = this.scheduleRepository.create(createScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  /**
   * Obtiene todos los horarios con filtros opcionales
   */
  async findAll(
    doctorId?: string,
    dayOfWeek?: number,
    onlyActive: boolean = true
  ): Promise<DoctorSchedule[]> {
    const where: any = {};
    
    if (doctorId) where.doctorId = doctorId;
    if (dayOfWeek !== undefined) where.dayOfWeek = dayOfWeek;
    if (onlyActive) where.isActive = true;

    return await this.scheduleRepository.find({
      where,
      relations: ['doctor', 'doctor.user', 'doctor.specialty'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' }
    });
  }

  /**
   * Obtiene un horario por su ID
   */
  async findById(id: string): Promise<DoctorSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'doctor.specialty']
    });

    if (!schedule) {
      throw new NotFoundException(`Horario con ID ${id} no encontrado`);
    }

    return schedule;
  }

  /**
   * Obtiene todos los horarios de un doctor
   */
  async findByDoctor(doctorId: string, onlyActive: boolean = true): Promise<DoctorSchedule[]> {
    const where: any = { doctorId };
    if (onlyActive) where.isActive = true;

    return await this.scheduleRepository.find({
      where,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' }
    });
  }

  /**
   * Obtiene los horarios de un doctor para un día específico
   */
  async findByDoctorAndDay(
    doctorId: string,
    dayOfWeek: number,
    onlyActive: boolean = true
  ): Promise<DoctorSchedule[]> {
    // Validar dayOfWeek
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('dayOfWeek debe estar entre 0 (Domingo) y 6 (Sábado)');
    }

    const where: any = { doctorId, dayOfWeek };
    if (onlyActive) where.isActive = true;

    return await this.scheduleRepository.find({
      where,
      order: { startTime: 'ASC' }
    });
  }

  /**
   * Obtiene los horarios activos de un doctor para una fecha específica
   */
  async findByDoctorAndDate(doctorId: string, date: Date): Promise<DoctorSchedule[]> {
    const dayOfWeek = date.getDay();

    return await this.findByDoctorAndDay(doctorId, dayOfWeek, true);
  }

  /**
   * Actualiza un horario existente
   */
  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<DoctorSchedule> {
    const schedule = await this.findById(id);

    // Si se actualiza el horario, validar que no haya solapamiento
    if (updateScheduleDto.startTime || updateScheduleDto.endTime || updateScheduleDto.dayOfWeek !== undefined) {
      const newStartTime = updateScheduleDto.startTime || schedule.startTime;
      const newEndTime = updateScheduleDto.endTime || schedule.endTime;
      const newDayOfWeek = updateScheduleDto.dayOfWeek !== undefined 
        ? updateScheduleDto.dayOfWeek 
        : schedule.dayOfWeek;

      // Validar que startTime < endTime
      if (newStartTime >= newEndTime) {
        throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
      }

      // Verificar solapamiento con otros horarios
      const existingSchedules = await this.scheduleRepository.find({
        where: {
          doctorId: schedule.doctorId,
          dayOfWeek: newDayOfWeek,
          isActive: true
        }
      });

      for (const existing of existingSchedules) {
        // Saltar el horario actual
        if (existing.id === id) continue;

        if (this.hasTimeOverlap(newStartTime, newEndTime, existing.startTime, existing.endTime)) {
          throw new ConflictException(
            `El nuevo horario se solapa con un horario existente para este día`
          );
        }
      }
    }

    Object.assign(schedule, updateScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  /**
   * Activa un horario
   */
  async activate(id: string): Promise<DoctorSchedule> {
    const schedule = await this.findById(id);
    
    // Verificar solapamientos antes de activar
    const existingSchedules = await this.scheduleRepository.find({
      where: {
        doctorId: schedule.doctorId,
        dayOfWeek: schedule.dayOfWeek,
        isActive: true
      }
    });

    for (const existing of existingSchedules) {
      if (existing.id === id) continue;

      if (this.hasTimeOverlap(
        schedule.startTime,
        schedule.endTime,
        existing.startTime,
        existing.endTime
      )) {
        throw new ConflictException(
          `No se puede activar el horario porque se solapa con otro horario activo`
        );
      }
    }

    schedule.isActive = true;
    return await this.scheduleRepository.save(schedule);
  }

  /**
   * Desactiva un horario (soft delete)
   */
  async deactivate(id: string): Promise<DoctorSchedule> {
    const schedule = await this.findById(id);
    schedule.isActive = false;
    return await this.scheduleRepository.save(schedule);
  }

  /**
   * Elimina un horario permanentemente
   */
  async delete(id: string): Promise<void> {
    const schedule = await this.findById(id);
    await this.scheduleRepository.remove(schedule);
  }

  /**
   * Elimina todos los horarios de un doctor
   */
  async deleteAllByDoctor(doctorId: string): Promise<void> {
    const schedules = await this.scheduleRepository.find({
      where: { doctorId }
    });

    if (schedules.length > 0) {
      await this.scheduleRepository.remove(schedules);
    }
  }

  /**
   * Verifica si un doctor tiene horarios configurados
   */
  async hasDoctorSchedules(doctorId: string): Promise<boolean> {
    const count = await this.scheduleRepository.count({
      where: { doctorId, isActive: true }
    });

    return count > 0;
  }

  /**
   * Obtiene los días de la semana en los que un doctor trabaja
   */
  async getWorkingDays(doctorId: string): Promise<number[]> {
    const schedules = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select('DISTINCT schedule.dayOfWeek', 'dayOfWeek')
      .where('schedule.doctorId = :doctorId', { doctorId })
      .andWhere('schedule.isActive = :isActive', { isActive: true })
      .orderBy('schedule.dayOfWeek', 'ASC')
      .getRawMany();

    return schedules.map(s => s.dayOfWeek);
  }

  /**
   * Obtiene estadísticas de horarios de un doctor
   */
  async getDoctorScheduleStats(doctorId: string): Promise<any> {
    const schedules = await this.findByDoctor(doctorId, true);
    
    const workingDays = new Set(schedules.map(s => s.dayOfWeek));
    
    // Calcular total de horas por semana
    let totalWeeklyMinutes = 0;
    
    for (const schedule of schedules) {
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      totalWeeklyMinutes += (endMinutes - startMinutes);
    }

    const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(2);

    return {
      doctorId,
      totalSchedules: schedules.length,
      workingDays: Array.from(workingDays).sort(),
      totalWorkingDays: workingDays.size,
      totalWeeklyHours: parseFloat(totalWeeklyHours),
      schedulesByDay: this.groupSchedulesByDay(schedules)
    };
  }

  /**
   * Crea múltiples horarios de una vez (útil para configuración inicial)
   */
  async createBulk(schedules: CreateScheduleDto[]): Promise<DoctorSchedule[]> {
    const createdSchedules: DoctorSchedule[] = [];

    for (const scheduleDto of schedules) {
      try {
        const schedule = await this.create(scheduleDto);
        createdSchedules.push(schedule);
      } catch (error) {
        // Si hay error en uno, continuar con los demás
        console.error(`Error creando horario:`, error.message);
      }
    }

    return createdSchedules;
  }

  /**
   * Duplica los horarios de un día a otro día
   */
  async duplicateSchedulesToDay(
    doctorId: string,
    sourceDayOfWeek: number,
    targetDayOfWeek: number
  ): Promise<DoctorSchedule[]> {
    const sourceSchedules = await this.findByDoctorAndDay(doctorId, sourceDayOfWeek, true);

    if (sourceSchedules.length === 0) {
      throw new NotFoundException(
        `No se encontraron horarios activos para el día ${sourceDayOfWeek}`
      );
    }

    const duplicatedSchedules: DoctorSchedule[] = [];

    for (const source of sourceSchedules) {
      const newSchedule = await this.create({
        doctorId: source.doctorId,
        dayOfWeek: targetDayOfWeek,
        startTime: source.startTime,
        endTime: source.endTime,
        isActive: true
      });

      duplicatedSchedules.push(newSchedule);
    }

    return duplicatedSchedules;
  }

  /**
   * Convierte el número de día en nombre
   */
  getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek] || 'Desconocido';
  }

  /**
   * Verifica si hay solapamiento entre dos rangos de tiempo
   * @private
   */
  private hasTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const [h1Start, m1Start] = start1.split(':').map(Number);
    const [h1End, m1End] = end1.split(':').map(Number);
    const [h2Start, m2Start] = start2.split(':').map(Number);
    const [h2End, m2End] = end2.split(':').map(Number);

    const minutes1Start = h1Start * 60 + m1Start;
    const minutes1End = h1End * 60 + m1End;
    const minutes2Start = h2Start * 60 + m2Start;
    const minutes2End = h2End * 60 + m2End;

    return (
      (minutes1Start >= minutes2Start && minutes1Start < minutes2End) ||
      (minutes1End > minutes2Start && minutes1End <= minutes2End) ||
      (minutes1Start <= minutes2Start && minutes1End >= minutes2End)
    );
  }

  /**
   * Agrupa horarios por día de la semana
   * @private
   */
  private groupSchedulesByDay(schedules: DoctorSchedule[]): any {
    const grouped: any = {};

    for (const schedule of schedules) {
      const dayName = this.getDayName(schedule.dayOfWeek);
      
      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }

      grouped[dayName].push({
        id: schedule.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive
      });
    }

    return grouped;
  }

  /**
   * Obtiene el próximo día disponible para un doctor
   */
  async getNextAvailableDay(doctorId: string, fromDate: Date = new Date()): Promise<Date | null> {
    const workingDays = await this.getWorkingDays(doctorId);

    if (workingDays.length === 0) {
      return null;
    }

    // Buscar el próximo día laboral
    const maxDaysToCheck = 14; // Buscar en las próximas 2 semanas
    let checkDate = new Date(fromDate);

    for (let i = 0; i < maxDaysToCheck; i++) {
      const dayOfWeek = checkDate.getDay();
      
      if (workingDays.includes(dayOfWeek)) {
        return checkDate;
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    return null;
  }

  /**
   * Verifica si un doctor trabaja en una fecha específica
   */
  async isDoctorWorkingOnDate(doctorId: string, date: Date): Promise<boolean> {
    const dayOfWeek = date.getDay();
    const schedules = await this.findByDoctorAndDay(doctorId, dayOfWeek, true);
    
    return schedules.length > 0;
  }

  /**
   * Obtiene el rango de horas de trabajo para un día específico
   */
  async getWorkingHoursRange(doctorId: string, date: Date): Promise<{ start: string; end: string } | null> {
    const schedules = await this.findByDoctorAndDate(doctorId, date);

    if (schedules.length === 0) {
      return null;
    }

    // Encontrar la hora más temprana y más tardía
    let earliestStart = schedules[0].startTime;
    let latestEnd = schedules[0].endTime;

    for (const schedule of schedules) {
      if (schedule.startTime < earliestStart) {
        earliestStart = schedule.startTime;
      }
      if (schedule.endTime > latestEnd) {
        latestEnd = schedule.endTime;
      }
    }

    return {
      start: earliestStart,
      end: latestEnd
    };
  }
}