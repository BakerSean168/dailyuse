/**
 * PrismaScheduleRepository
 * Prisma implementation of IScheduleRepository for CalendarEntry aggregate
 *
 * @module Schedule/Infrastructure
 * @since Story 9.3 (EPIC-SCHEDULE-001)
 */

import type { PrismaClient, Schedule as PrismaSchedule } from '@dailyuse/database';
import type { IScheduleRepository } from '../../../domain-server/repositories/IScheduleRepository';
import { CalendarEntry } from '../../../domain-server/aggregates/calendar-entry';
import { PrismaScheduleMapper } from './mappers/prisma-schedule-mapper';
import { createEventBusAdapter, publishAggregateEvents } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class SchedulePrismaRepository implements IScheduleRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Convert Prisma data to Domain Schedule entity
   */
  private mapToEntity(data: PrismaSchedule): CalendarEntry {
    return PrismaScheduleMapper.toDomain(data);
  }

  /**
   * Convert Domain Schedule entity to Prisma data
   */
  private mapToPrisma(schedule: CalendarEntry) {
    return PrismaScheduleMapper.toPersistence(schedule);
  }

  /**
   * Save (create or update) a schedule
   */
  async save(schedule: CalendarEntry): Promise<void> {
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
  async findById(id: string): Promise<CalendarEntry | null> {
    const data = await this.prisma.schedule.findUnique({
      where: { id },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Find all schedules for an account
   */
  async findByIdentityId(identityId: string): Promise<CalendarEntry[]> {
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
  ): Promise<CalendarEntry[]> {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        identityId,
        // Time overlap: schedule starts before query end
        startTime: { lt: new Date(endTime) },
        // AND schedule ends after query start
        endTime: { gt: new Date(startTime) },
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

  async deleteAggregate(entry: CalendarEntry): Promise<void> {
    await this.prisma.schedule.delete({
      where: { id: entry.id },
    });
    await publishAggregateEvents(entry, eventBusAdapter);
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

