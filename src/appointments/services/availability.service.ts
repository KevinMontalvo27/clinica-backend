import { 
  Injectable, 
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { ScheduleException } from '../entities/schedule-exception.entity';
import { Appointment } from '../entities/appointment.entity';

export interface TimeSlot {
  time: string;
  available: boolean;
  duration: number;
  reason?: string;
}

export interface DayAvailability {
  date: Date;
  dayOfWeek: number;
  dayName: string;
  isWorkingDay: boolean;
  hasException: boolean;
  slots: TimeSlot[];
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(ScheduleException)
    private readonly exceptionRepository: Repository<ScheduleException>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Obtiene los slots de tiempo disponibles para un doctor en una fecha específica
   */
  async getAvailableSlots(
    doctorId: string,
    date: Date,
    slotDuration: number = 30
  ): Promise<TimeSlot[]> {
    // 1. Obtener horarios del doctor para ese día
    const dayOfWeek = date.getDay();
    const schedules = await this.scheduleRepository.find({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true
      },
      order: { startTime: 'ASC' }
    });

    // Si no hay horarios configurados
    if (schedules.length === 0) {
      return [];
    }

    // 2. Verificar si hay excepción de día completo
    const exceptions = await this.exceptionRepository.find({
      where: {
        doctorId,
        exceptionDate: this.getDateOnly(date)
      }
    });

    const hasFullDayException = exceptions.some(e => !e.startTime && !e.endTime);
    if (hasFullDayException) {
      return [];
    }

    // 3. Obtener citas ya agendadas
    const appointments = await this.appointmentRepository.find({
      where: {
        doctorId,
        appointmentDate: this.getDateOnly(date),
        status: ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'] as any
      }
    });

    // 4. Generar todos los slots posibles
    const allSlots: TimeSlot[] = [];

    for (const schedule of schedules) {
      const slots = this.generateSlotsFromSchedule(
        schedule.startTime,
        schedule.endTime,
        slotDuration
      );
      allSlots.push(...slots);
    }

    // 5. Marcar slots como no disponibles según excepciones parciales
    const partialExceptions = exceptions.filter(e => e.startTime && e.endTime);
    for (const exception of partialExceptions) {
      this.markSlotsAsUnavailable(
        allSlots,
        exception.startTime!,
        exception.endTime!,
        exception.reason || 'Bloqueado'
      );
    }

    // 6. Marcar slots como no disponibles según citas
    for (const appointment of appointments) {
      const endTime = this.addMinutesToTime(
        appointment.appointmentTime,
        appointment.duration
      );
      this.markSlotsAsUnavailable(
        allSlots,
        appointment.appointmentTime,
        endTime,
        'Cita agendada'
      );
    }

    // 7. Filtrar slots en el pasado si la fecha es hoy
    return this.filterPastSlots(allSlots, date);
  }

  /**
   * Verifica si un slot de tiempo específico está disponible
   */
  async isTimeSlotAvailable(
    doctorId: string,
    date: Date,
    time: string,
    duration: number = 30
  ): Promise<{ available: boolean; reason?: string }> {
    const slots = await this.getAvailableSlots(doctorId, date, duration);
    
    const slot = slots.find(s => s.time === time);
    
    if (!slot) {
      return { available: false, reason: 'Horario fuera del horario de trabajo' };
    }

    if (!slot.available) {
      return { available: false, reason: slot.reason };
    }

    // Verificar que haya suficientes slots consecutivos disponibles
    const endTime = this.addMinutesToTime(time, duration);
    const requiredSlots = this.getSlotsBetween(slots, time, endTime);
    
    const allAvailable = requiredSlots.every(s => s.available);
    
    if (!allAvailable) {
      return { available: false, reason: 'No hay suficiente tiempo disponible' };
    }

    return { available: true };
  }

  /**
   * Obtiene los próximos N slots disponibles desde una fecha
   */
  async getNextAvailableSlots(
    doctorId: string,
    fromDate: Date = new Date(),
    count: number = 10,
    slotDuration: number = 30
  ): Promise<{ date: Date; time: string }[]> {
    const availableSlots: { date: Date; time: string }[] = [];
    const maxDaysToCheck = 30; // Buscar hasta 30 días adelante
    let currentDate = new Date(fromDate);

    for (let day = 0; day < maxDaysToCheck && availableSlots.length < count; day++) {
      const slots = await this.getAvailableSlots(doctorId, currentDate, slotDuration);
      
      for (const slot of slots) {
        if (slot.available && availableSlots.length < count) {
          availableSlots.push({
            date: new Date(currentDate),
            time: slot.time
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availableSlots;
  }

  /**
   * Obtiene la disponibilidad completa de una semana
   */
  async getWeekAvailability(
    doctorId: string,
    startDate: Date,
    slotDuration: number = 30
  ): Promise<DayAvailability[]> {
    const weekAvailability: DayAvailability[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const slots = await this.getAvailableSlots(doctorId, currentDate, slotDuration);
      const exceptions = await this.exceptionRepository.find({
        where: {
          doctorId,
          exceptionDate: this.getDateOnly(currentDate)
        }
      });

      weekAvailability.push({
        date: new Date(currentDate),
        dayOfWeek: currentDate.getDay(),
        dayName: this.getDayName(currentDate.getDay()),
        isWorkingDay: slots.length > 0,
        hasException: exceptions.length > 0,
        slots
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weekAvailability;
  }

  /**
   * Obtiene disponibilidad de un mes completo
   */
  async getMonthAvailability(
    doctorId: string,
    year: number,
    month: number,
    slotDuration: number = 30
  ): Promise<DayAvailability[]> {
    const monthAvailability: DayAvailability[] = [];
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Último día del mes

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const slots = await this.getAvailableSlots(doctorId, currentDate, slotDuration);
      const exceptions = await this.exceptionRepository.find({
        where: {
          doctorId,
          exceptionDate: this.getDateOnly(currentDate)
        }
      });

      monthAvailability.push({
        date: new Date(currentDate),
        dayOfWeek: currentDate.getDay(),
        dayName: this.getDayName(currentDate.getDay()),
        isWorkingDay: slots.length > 0,
        hasException: exceptions.length > 0,
        slots
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return monthAvailability;
  }

  /**
   * Obtiene un resumen de disponibilidad (solo días, sin slots detallados)
   */
  async getAvailabilitySummary(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: Date; available: boolean; slotsCount: number }[]> {
    const summary: { date: Date; available: boolean; slotsCount: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const slots = await this.getAvailableSlots(doctorId, currentDate);
      const availableSlots = slots.filter(s => s.available);

      summary.push({
        date: new Date(currentDate),
        available: availableSlots.length > 0,
        slotsCount: availableSlots.length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return summary;
  }

  /**
   * Obtiene estadísticas de disponibilidad de un doctor
   */
  async getAvailabilityStats(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const summary = await this.getAvailabilitySummary(doctorId, startDate, endDate);

    const totalDays = summary.length;
    const availableDays = summary.filter(s => s.available).length;
    const totalSlots = summary.reduce((sum, s) => sum + s.slotsCount, 0);

    return {
      doctorId,
      startDate,
      endDate,
      totalDays,
      availableDays,
      unavailableDays: totalDays - availableDays,
      totalAvailableSlots: totalSlots,
      averageSlotsPerDay: totalDays > 0 ? (totalSlots / totalDays).toFixed(2) : 0
    };
  }

  /**
   * Encuentra el primer slot disponible desde una fecha
   */
  async getFirstAvailableSlot(
    doctorId: string,
    fromDate: Date = new Date(),
    slotDuration: number = 30
  ): Promise<{ date: Date; time: string } | null> {
    const slots = await this.getNextAvailableSlots(doctorId, fromDate, 1, slotDuration);
    return slots.length > 0 ? slots[0] : null;
  }

  /**
   * Verifica si un doctor tiene disponibilidad en un rango de fechas
   */
  async hasAvailabilityInRange(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const summary = await this.getAvailabilitySummary(doctorId, startDate, endDate);
    return summary.some(s => s.available);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Genera slots de tiempo desde un rango
   * @private
   */
  private generateSlotsFromSchedule(
    startTime: string,
    endTime: string,
    slotDuration: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
      const nextTime = this.addMinutesToTime(currentTime, slotDuration);
      
      // Solo agregar si el slot completo cabe en el horario
      if (nextTime <= endTime) {
        slots.push({
          time: currentTime,
          available: true,
          duration: slotDuration
        });
      }

      currentTime = nextTime;
    }

    return slots;
  }

  /**
   * Marca slots como no disponibles en un rango de tiempo
   * @private
   */
  private markSlotsAsUnavailable(
    slots: TimeSlot[],
    startTime: string,
    endTime: string,
    reason: string
  ): void {
    for (const slot of slots) {
      const slotEnd = this.addMinutesToTime(slot.time, slot.duration);
      
      // Verificar si hay solapamiento
      if (this.hasTimeOverlap(slot.time, slotEnd, startTime, endTime)) {
        slot.available = false;
        slot.reason = reason;
      }
    }
  }

  /**
   * Filtra slots que ya pasaron (solo para el día actual)
   * @private
   */
  private filterPastSlots(slots: TimeSlot[], date: Date): TimeSlot[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Si no es hoy, retornar todos los slots
    if (targetDate.getTime() !== today.getTime()) {
      return slots;
    }

    // Si es hoy, filtrar slots pasados
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    return slots.filter(slot => slot.time >= currentTime);
  }

  /**
   * Obtiene slots entre dos tiempos
   * @private
   */
  private getSlotsBetween(slots: TimeSlot[], startTime: string, endTime: string): TimeSlot[] {
    return slots.filter(slot => slot.time >= startTime && slot.time < endTime);
  }

  /**
   * Añade minutos a una hora
   * @private
   */
  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
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
    return start1 < end2 && start2 < end1;
  }

  /**
   * Obtiene solo la fecha sin hora
   * @private
   */
  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Obtiene el nombre del día
   * @private
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  }
}