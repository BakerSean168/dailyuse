/**
 * PrismaScheduleRepository
 * Prisma implementation of IScheduleRepository for Schedule aggregate
 *
 * @module Schedule/Infrastructure
 * @since Story 9.3 (EPIC-SCHEDULE-001)
 */

import type {  PrismaClient  } from '@dailyuse/database';
import type { IScheduleRepository } from '../../../domain-server/repositories/IScheduleRepository';
import { Schedule } from '../../../domain-server/aggregates/schedule';

export class SchedulePrismaRepository implements IScheduleRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Convert Prisma data to Domain Schedule entity
   */
  private mapToEntity(data: any): Schedule {
    // Convert Prisma data to ScheduleServerDTO format first
    return Schedule.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      startTime: Number(data.startTime), // BigInt 锟?number (milliseconds)
      endTime: Number(data.endTime), // BigInt 锟?number (milliseconds)
      duration: data.duration,
      hasConflict: data.hasConflict,
      conflictingSchedules: data.conflictingSchedules
        ? JSON.parse(data.conflictingSchedules)
        : [],
      priority: data.priority,
      location: data.location,
      attendees: data.attendees ? JSON.parse(data.attendees) : undefined,
      createdAt: data.createdAt.getTime(), // Date 锟?number (milliseconds)
      updatedAt: data.updatedAt.getTime(), // Date 锟?number (milliseconds)
    });
  }

  /**
   * Convert Domain Schedule entity to Prisma data
   */
  private mapToPrisma(schedule: Schedule): any {
    const dto = schedule.toPersistenceDTO();

    return {
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description ?? null,
      startTime: BigInt(dto.startTime), // number 鈫?BigInt (milliseconds)
      endTime: BigInt(dto.endTime), // number 鈫?BigInt (milliseconds)
      duration: dto.duration,
      hasConflict: dto.hasConflict,
      conflictingSchedules: dto.conflictingSchedules && dto.conflictingSchedules.length > 0
        ? JSON.stringify(dto.conflictingSchedules)
        : null,
      priority: dto.priority ?? null,
      location: dto.location ?? null,
      attendees: dto.attendees ? JSON.stringify(dto.attendees) : null,
      createdAt: new Date(dto.createdAt), // number 锟?Date
      updatedAt: new Date(dto.updatedAt), // number 锟?Date
    };
  }

  /**
   * Save (create or update) a schedule
   */
  async save(schedule: Schedule): Promise<void> {
    const data = this.mapToPrisma(schedule);

    await this.prisma.schedule.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  /**
   * Find schedule by UUID
   */
  async findById(id: string): Promise<Schedule | null> {
    const data = await this.prisma.schedule.findUnique({
      where: { id },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Find all schedules for an account
   */
  async findByIdentityId(identityId: string): Promise<Schedule[]> {
    const schedules = await this.prisma.schedule.findMany({
      where: { identityId },
      orderBy: { startTime: 'asc' },
    });

    return schedules.map((s) => this.mapToEntity(s));
  }

  /**
   * Find schedules that overlap a given time range
   * Critical method for conflict detection
   * 
   * Time overlap condition: (A.start < B.end) AND (A.end > B.start)
   */
  async findByTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    excludeId?: string
  ): Promise<Schedule[]> {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        identityId,
        // Time overlap: schedule starts before query end
        startTime: { lt: BigInt(endTime) },
        // AND schedule ends after query start
        endTime: { gt: BigInt(startTime) },
        // Exclude current schedule (for editing scenarios)
        ...(excludeId && { id: { not: excludeId } }),
      },
      orderBy: { startTime: 'asc' },
    });

    return schedules.map((s) => this.mapToEntity(s));
  }

  /**
   * Delete schedule by UUID
   */
  async deleteById(id: string): Promise<void> {
    await this.prisma.schedule.delete({
      where: { id },
    });
  }

  /**
   * Execute a function within a transaction
   */
  async withTransaction<T>(
    fn: (repo: IScheduleRepository) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new SchedulePrismaRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}

export default SchedulePrismaRepository;

