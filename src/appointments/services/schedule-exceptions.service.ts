import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ScheduleException } from '../entities/schedule-exception.entity';
import { CreateScheduleExceptionDto } from '../dtos/create-schedule-exception.dto';

@Injectable()
export class ScheduleExceptionsService {
  constructor(
    @InjectRepository(ScheduleException)
    private readonly exceptionRepository: Repository<ScheduleException>,
  ) {}

  /**
   * Crea una nueva excepción de horario
   */
  async create(createExceptionDto: CreateScheduleExceptionDto): Promise<ScheduleException> {
    // Validar que la fecha no sea en el pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exceptionDate = new Date(createExceptionDto.exceptionDate);
    exceptionDate.setHours(0, 0, 0, 0);

    if (exceptionDate < today) {
      throw new BadRequestException('No se pueden crear excepciones en fechas pasadas');
    }

    // Si hay startTime y endTime, validar que startTime < endTime
    if (createExceptionDto.startTime && createExceptionDto.endTime) {
      if (createExceptionDto.startTime >= createExceptionDto.endTime) {
        throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
      }
    }

    // Verificar que no exista una excepción que se solape
    const existingExceptions = await this.findByDoctorAndDate(
      createExceptionDto.doctorId,
      createExceptionDto.exceptionDate
    );

    for (const existing of existingExceptions) {
      // Si ambas son excepciones de día completo
      if (!createExceptionDto.startTime && !existing.startTime) {
        throw new ConflictException('Ya existe una excepción de día completo para esta fecha');
      }

      // Si hay solapamiento de horas
      if (createExceptionDto.startTime && createExceptionDto.endTime && 
          existing.startTime && existing.endTime) {
        if (this.hasTimeOverlap(
          createExceptionDto.startTime,
          createExceptionDto.endTime,
          existing.startTime,
          existing.endTime
        )) {
          throw new ConflictException(
            'Ya existe una excepción que se solapa con el rango de tiempo especificado'
          );
        }
      }

      // Si la nueva es día completo pero hay excepciones parciales
      if (!createExceptionDto.startTime && existing.startTime) {
        throw new ConflictException(
          'Ya existen excepciones parciales para esta fecha. Elimínelas primero.'
        );
      }

      // Si hay excepciones de día completo pero se intenta crear parcial
      if (createExceptionDto.startTime && !existing.startTime) {
        throw new ConflictException(
          'Ya existe una excepción de día completo para esta fecha'
        );
      }
    }

    const exception = this.exceptionRepository.create(createExceptionDto);
    return await this.exceptionRepository.save(exception);
  }

  /**
   * Obtiene todas las excepciones con filtros
   */
  async findAll(
    doctorId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ScheduleException[]> {
    const qb = this.exceptionRepository
      .createQueryBuilder('exception')
      .leftJoinAndSelect('exception.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'user');

    if (doctorId) {
      qb.andWhere('exception.doctorId = :doctorId', { doctorId });
    }

    if (startDate && endDate) {
      qb.andWhere('exception.exceptionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    } else if (startDate) {
      qb.andWhere('exception.exceptionDate >= :startDate', { startDate });
    } else if (endDate) {
      qb.andWhere('exception.exceptionDate <= :endDate', { endDate });
    }

    qb.orderBy('exception.exceptionDate', 'ASC')
      .addOrderBy('exception.startTime', 'ASC');

    return await qb.getMany();
  }

  /**
   * Obtiene una excepción por su ID
   */
  async findById(id: string): Promise<ScheduleException> {
    const exception = await this.exceptionRepository.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user']
    });

    if (!exception) {
      throw new NotFoundException(`Excepción con ID ${id} no encontrada`);
    }

    return exception;
  }

  /**
   * Obtiene todas las excepciones de un doctor
   */
  async findByDoctor(
    doctorId: string,
    includeExpired: boolean = false
  ): Promise<ScheduleException[]> {
    const qb = this.exceptionRepository
      .createQueryBuilder('exception')
      .where('exception.doctorId = :doctorId', { doctorId });

    if (!includeExpired) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      qb.andWhere('exception.exceptionDate >= :today', { today });
    }

    qb.orderBy('exception.exceptionDate', 'ASC')
      .addOrderBy('exception.startTime', 'ASC');

    return await qb.getMany();
  }

  /**
   * Obtiene excepciones de un doctor para una fecha específica
   */
  async findByDoctorAndDate(
    doctorId: string,
    date: Date
  ): Promise<ScheduleException[]> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    return await this.exceptionRepository.find({
      where: {
        doctorId,
        exceptionDate: dateOnly
      },
      order: { startTime: 'ASC' }
    });
  }

  /**
   * Obtiene excepciones en un rango de fechas
   */
  async findByDoctorAndDateRange(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ScheduleException[]> {
    return await this.exceptionRepository.find({
      where: {
        doctorId,
        exceptionDate: Between(startDate, endDate)
      },
      order: { exceptionDate: 'ASC', startTime: 'ASC' }
    });
  }

  /**
   * Obtiene las próximas excepciones de un doctor
   */
  async findUpcoming(
    doctorId: string,
    limit: number = 10
  ): Promise<ScheduleException[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.exceptionRepository.find({
      where: {
        doctorId,
        exceptionDate: MoreThanOrEqual(today)
      },
      order: { exceptionDate: 'ASC', startTime: 'ASC' },
      take: limit
    });
  }

  /**
   * Verifica si existe una excepción para un doctor en una fecha específica
   */
  async hasExceptionOnDate(
    doctorId: string,
    date: Date,
    timeToCheck?: string
  ): Promise<boolean> {
    const exceptions = await this.findByDoctorAndDate(doctorId, date);

    if (exceptions.length === 0) {
      return false;
    }

    // Si no se proporciona hora, verificar si hay alguna excepción
    if (!timeToCheck) {
      return true;
    }

    // Si hay una excepción de día completo
    const fullDayException = exceptions.find(e => !e.startTime && !e.endTime);
    if (fullDayException) {
      return true;
    }

    // Verificar si la hora está dentro de alguna excepción parcial
    for (const exception of exceptions) {
      if (exception.startTime && exception.endTime) {
        if (timeToCheck >= exception.startTime && timeToCheck < exception.endTime) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Verifica si una fecha es día completo de excepción
   */
  async isFullDayException(doctorId: string, date: Date): Promise<boolean> {
    const exceptions = await this.findByDoctorAndDate(doctorId, date);
    
    return exceptions.some(e => !e.startTime && !e.endTime);
  }

  /**
   * Obtiene las horas bloqueadas en una fecha
   */
  async getBlockedTimeRanges(
    doctorId: string,
    date: Date
  ): Promise<{ startTime: string; endTime: string; reason: string }[]> {
    const exceptions = await this.findByDoctorAndDate(doctorId, date);

    return exceptions
      .filter(e => e.startTime && e.endTime)
      .map(e => ({
        startTime: e.startTime!,
        endTime: e.endTime!,
        reason: e.reason || 'Bloqueado'
      }));
  }

  /**
   * Elimina una excepción
   */
  async delete(id: string): Promise<void> {
    const exception = await this.findById(id);
    await this.exceptionRepository.remove(exception);
  }

  /**
   * Elimina todas las excepciones de un doctor
   */
  async deleteAllByDoctor(doctorId: string): Promise<void> {
    const exceptions = await this.exceptionRepository.find({
      where: { doctorId }
    });

    if (exceptions.length > 0) {
      await this.exceptionRepository.remove(exceptions);
    }
  }

  /**
   * Elimina todas las excepciones de un doctor en una fecha
   */
  async deleteAllByDoctorAndDate(doctorId: string, date: Date): Promise<void> {
    const exceptions = await this.findByDoctorAndDate(doctorId, date);

    if (exceptions.length > 0) {
      await this.exceptionRepository.remove(exceptions);
    }
  }

  /**
   * Elimina excepciones expiradas (fechas pasadas)
   */
  async deleteExpired(doctorId?: string): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const qb = this.exceptionRepository
      .createQueryBuilder('exception')
      .where('exception.exceptionDate < :yesterday', { yesterday });

    if (doctorId) {
      qb.andWhere('exception.doctorId = :doctorId', { doctorId });
    }

    const exceptions = await qb.getMany();
    
    if (exceptions.length > 0) {
      await this.exceptionRepository.remove(exceptions);
    }

    return exceptions.length;
  }

  /**
   * Crea excepciones para múltiples días (útil para vacaciones)
   */
  async createMultipleDays(
    doctorId: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    startTime?: string,
    endTime?: string
  ): Promise<ScheduleException[]> {
    const exceptions: ScheduleException[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const finalDate = new Date(endDate);
    finalDate.setHours(0, 0, 0, 0);

    // Validar fechas
    if (currentDate > finalDate) {
      throw new BadRequestException('La fecha de inicio debe ser menor o igual a la fecha de fin');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (currentDate < today) {
      throw new BadRequestException('No se pueden crear excepciones en fechas pasadas');
    }

    // Validar rango de tiempo si se proporciona
    if (startTime && endTime && startTime >= endTime) {
      throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
    }

    // Crear excepciones día por día
    while (currentDate <= finalDate) {
      try {
        const exception = await this.create({
          doctorId,
          exceptionDate: new Date(currentDate),
          startTime,
          endTime,
          reason
        });
        exceptions.push(exception);
      } catch (error) {
        // Si hay conflicto, continuar con el siguiente día
        console.error(`Error creando excepción para ${currentDate.toISOString()}:`, error.message);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return exceptions;
  }

  /**
   * Cuenta excepciones por doctor
   */
  async countByDoctor(
    doctorId: string,
    onlyFuture: boolean = true
  ): Promise<number> {
    const qb = this.exceptionRepository
      .createQueryBuilder('exception')
      .where('exception.doctorId = :doctorId', { doctorId });

    if (onlyFuture) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      qb.andWhere('exception.exceptionDate >= :today', { today });
    }

    return await qb.getCount();
  }

  /**
   * Obtiene estadísticas de excepciones de un doctor
   */
  async getDoctorExceptionStats(doctorId: string): Promise<any> {
    const allExceptions = await this.findByDoctor(doctorId, true);
    const futureExceptions = await this.findByDoctor(doctorId, false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fullDayExceptions = allExceptions.filter(e => !e.startTime && !e.endTime);
    const partialExceptions = allExceptions.filter(e => e.startTime && e.endTime);

    const expiredExceptions = allExceptions.filter(e => {
      const exDate = new Date(e.exceptionDate);
      exDate.setHours(0, 0, 0, 0);
      return exDate < today;
    });

    return {
      doctorId,
      total: allExceptions.length,
      future: futureExceptions.length,
      expired: expiredExceptions.length,
      fullDay: fullDayExceptions.length,
      partial: partialExceptions.length,
      nextException: futureExceptions[0] || null
    };
  }

  /**
   * Obtiene los días bloqueados en un mes
   */
  async getBlockedDaysInMonth(
    doctorId: string,
    year: number,
    month: number
  ): Promise<Date[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const exceptions = await this.findByDoctorAndDateRange(doctorId, startDate, endDate);

    // Obtener solo las fechas de día completo bloqueadas
    const blockedDates = exceptions
      .filter(e => !e.startTime && !e.endTime)
      .map(e => e.exceptionDate);

    return blockedDates;
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
    const [h1Start, m1Start, s1Start] = start1.split(':').map(Number);
    const [h1End, m1End, s1End] = end1.split(':').map(Number);
    const [h2Start, m2Start, s2Start] = start2.split(':').map(Number);
    const [h2End, m2End, s2End] = end2.split(':').map(Number);

    const seconds1Start = h1Start * 3600 + m1Start * 60 + (s1Start || 0);
    const seconds1End = h1End * 3600 + m1End * 60 + (s1End || 0);
    const seconds2Start = h2Start * 3600 + m2Start * 60 + (s2Start || 0);
    const seconds2End = h2End * 3600 + m2End * 60 + (s2End || 0);

    return (
      (seconds1Start >= seconds2Start && seconds1Start < seconds2End) ||
      (seconds1End > seconds2Start && seconds1End <= seconds2End) ||
      (seconds1Start <= seconds2Start && seconds1End >= seconds2End)
    );
  }

  /**
   * Formatea la excepción para respuesta
   */
  formatException(exception: ScheduleException): any {
    return {
      id: exception.id,
      doctorId: exception.doctorId,
      exceptionDate: exception.exceptionDate,
      isFullDay: !exception.startTime && !exception.endTime,
      startTime: exception.startTime || null,
      endTime: exception.endTime || null,
      reason: exception.reason,
      createdAt: exception.createdAt,
      updatedAt: exception.updatedAt
    };
  }
}