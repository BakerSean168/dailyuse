/**
 * PrismaScheduleRepository
 * Prisma implementation of IScheduleRepository for CalendarEntry aggregate
 *
 * @module Schedule/Infrastructure
 * @since Story 9.3 (EPIC-SCHEDULE-001)
 */

import type { PrismaClient, Schedule as PrismaSchedule } from '@dailyuse/database';
import type { IScheduleRepository } from '../../../domain/repositories/i-schedule-repository';
import { CalendarEntry } from '../../../domain/aggregates/calendar-entry';
import { PrismaScheduleMapper } from './mappers/prisma-schedule-mapper';
import { createEventBusAdapter, publishAggregateEvents } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';

const eventBusAdapter = createEventBusAdapter(eventBus);

/**
 * Minimal DB capability interface for Schedule repository.
 * Both PrismaClient and Prisma.TransactionClient satisfy this.
 */
interface ScheduleDb {
  schedule: PrismaClient['schedule'];
}

type PrismaTransactionRoot = Pick<PrismaClient, '$transaction'>;
type ScheduleRootDb = ScheduleDb & PrismaTransactionRoot;

function isScheduleRootDb(db: ScheduleDb | ScheduleRootDb): db is ScheduleRootDb {
  return '$transaction' in db;
}

export class SchedulePrismaRepository implements IScheduleRepository {
  private readonly db: ScheduleDb;
  private readonly rootClient: PrismaTransactionRoot | null;

  constructor(prisma: PrismaClient);
  constructor(prisma: ScheduleDb, rootClient?: PrismaTransactionRoot);
  constructor(prisma: ScheduleDb | PrismaClient, rootClient?: PrismaTransactionRoot) {
    this.db = prisma;
    this.rootClient = rootClient ?? (isScheduleRootDb(prisma) ? prisma : null);
  }

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

    await this.db.schedule.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  /**
   * Find schedule by UUID owned by identity
   */
  async findByIdForIdentity(identityId: string, id: string): Promise<CalendarEntry | null> {
    const data = await this.db.schedule.findFirst({
      where: { id, identityId },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Find all schedules for an account
   */
  async findByIdentityId(identityId: string): Promise<CalendarEntry[]> {
    const schedules = await this.db.schedule.findMany({
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
    const schedules = await this.db.schedule.findMany({
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
   * Delete schedule by UUID for the owning identity
   */
  async deleteById(identityId: string, id: string): Promise<void> {
    const deleted = await this.db.schedule.deleteMany({
      where: { id, identityId },
    });
    if (deleted.count !== 1) {
      throw new Error('Schedule event not found for the current identity.');
    }
  }

  async deleteAggregate(entry: CalendarEntry): Promise<void> {
    const deleted = await this.db.schedule.deleteMany({
      where: { id: entry.id, identityId: entry.identityId },
    });
    if (deleted.count !== 1) {
      throw new Error('Schedule event not found for the current identity.');
    }
    await publishAggregateEvents(entry, eventBusAdapter);
  }

  /**
   * Execute a function within a transaction
   */
  async withTransaction<T>(
    fn: (repo: IScheduleRepository) => Promise<T>
  ): Promise<T> {
    if (!this.rootClient) {
      throw new Error('withTransaction requires a root PrismaClient (not a TransactionClient)');
    }
    return this.rootClient.$transaction(async (tx) => {
      const txRepo = new SchedulePrismaRepository(tx);
      return fn(txRepo);
    });
  }
}

export default SchedulePrismaRepository;
