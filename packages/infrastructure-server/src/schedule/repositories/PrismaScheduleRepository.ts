/**
 * PrismaScheduleRepository
 * Prisma implementation of IScheduleRepository for Schedule aggregate
 *
 * @module Schedule/Infrastructure
 * @since Story 9.3 (EPIC-SCHEDULE-001)
 */

import { PrismaClient } from '@prisma/client';
import type { IScheduleRepository } from '@dailyuse/domain-server/schedule';
import { Schedule } from '@dailyuse/domain-server/schedule';

export class PrismaScheduleRepository implements IScheduleRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Convert Prisma data to Domain Schedule entity
   */
  private mapToEntity(data: any): Schedule {
    // Convert Prisma data to ScheduleServerDTO format first
    return Schedule.fromServerDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      title: data.title,
      description: data.description,
      startTime: Number(data.startTime), // BigInt → number (milliseconds)
      endTime: Number(data.endTime), // BigInt → number (milliseconds)
      duration: data.duration,
      hasConflict: data.hasConflict,
      conflictingSchedules: data.conflictingSchedules
        ? JSON.parse(data.conflictingSchedules)
        : [],
      priority: data.priority,
      location: data.location,
      attendees: data.attendees ? JSON.parse(data.attendees) : undefined,
      createdAt: data.createdAt.getTime(), // Date → number (milliseconds)
      updatedAt: data.updatedAt.getTime(), // Date → number (milliseconds)
    });
  }

  /**
   * Convert Domain Schedule entity to Prisma data
   */
  private mapToPrisma(schedule: Schedule): any {
    const dto = schedule.toServerDTO();

    return {
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description ?? null,
      startTime: BigInt(dto.startTime), // number → BigInt (milliseconds)
      endTime: BigInt(dto.endTime), // number → BigInt (milliseconds)
      duration: dto.duration,
      hasConflict: dto.hasConflict,
      conflictingSchedules: dto.conflictingSchedules && dto.conflictingSchedules.length > 0
        ? JSON.stringify(dto.conflictingSchedules)
        : null,
      priority: dto.priority ?? null,
      location: dto.location ?? null,
      attendees: dto.attendees ? JSON.stringify(dto.attendees) : null,
      createdAt: new Date(dto.createdAt), // number → Date
      updatedAt: new Date(dto.updatedAt), // number → Date
    };
  }

  /**
   * Save (create or update) a schedule
   */
  async save(schedule: Schedule): Promise<void> {
    const data = this.mapToPrisma(schedule);

    await this.prisma.schedule.upsert({
      where: { uuid: data.uuid },
      create: data,
      update: data,
    });
  }

  /**
   * Find schedule by UUID
   */
  async findByUuid(uuid: string): Promise<Schedule | null> {
    const data = await this.prisma.schedule.findUnique({
      where: { uuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Find all schedules for an account
   */
  async findByAccountUuid(accountUuid: string): Promise<Schedule[]> {
    const schedules = await this.prisma.schedule.findMany({
      where: { accountUuid },
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
    accountUuid: string,
    startTime: number,
    endTime: number,
    excludeUuid?: string
  ): Promise<Schedule[]> {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        accountUuid,
        // Time overlap: schedule starts before query end
        startTime: { lt: BigInt(endTime) },
        // AND schedule ends after query start
        endTime: { gt: BigInt(startTime) },
        // Exclude current schedule (for editing scenarios)
        ...(excludeUuid && { uuid: { not: excludeUuid } }),
      },
      orderBy: { startTime: 'asc' },
    });

    return schedules.map((s) => this.mapToEntity(s));
  }

  /**
   * Delete schedule by UUID
   */
  async deleteByUuid(uuid: string): Promise<void> {
    await this.prisma.schedule.delete({
      where: { uuid },
    });
  }

  /**
   * Execute a function within a transaction
   */
  async withTransaction<T>(
    fn: (repo: IScheduleRepository) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new PrismaScheduleRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}

export default PrismaScheduleRepository;
