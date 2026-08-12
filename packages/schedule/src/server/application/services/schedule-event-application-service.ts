import { toResultErrorException } from '@memoflow/contracts/result';
import type { CalendarEntryClientDTO } from '@memoflow/contracts/schedule';
import type { IdentityId } from '@memoflow/domain-shared';
import { CalendarEntry } from '../../domain/aggregates/calendar-entry';
import type { IScheduleRepository } from '../../domain/repositories/i-schedule-repository';
import { ScheduleConflictCacheService } from './schedule-conflict-cache-service';

export class ScheduleEventApplicationService {
  constructor(private scheduleRepository: IScheduleRepository) {}

  private static notFound(id: string): never {
    throw toResultErrorException(
      { code: 'NOT_FOUND', message: `Schedule event ${id} not found` },
      404,
    );
  }

  private static invalidVersion(): never {
    throw toResultErrorException(
      { code: 'VALIDATION_ERROR', message: 'expectedVersion is required and must be a valid number' },
      400,
    );
  }

  async createSchedule(params: {
    identityId: string;
    title: string;
    startTime: number;
    endTime: number;
    description?: string;
    location?: string;
    priority?: number;
    attendees?: string[];
  }): Promise<CalendarEntryClientDTO> {
    const result = await this.withScheduleRepository(async (scheduleRepository) => {
      const conflictCacheService = new ScheduleConflictCacheService(scheduleRepository);
      const schedule = CalendarEntry.create({
        identityId: params.identityId as IdentityId,
        title: params.title,
        startTime: params.startTime,
        endTime: params.endTime,
        description: params.description,
        location: params.location,
        priority: params.priority,
        attendees: params.attendees,
      });

      await scheduleRepository.save(schedule);
      await conflictCacheService.refreshForTimeRange(
        schedule.identityId,
        schedule.startTime,
        schedule.endTime,
      );

      await scheduleRepository.createRebuildOutbox({
        identityId: schedule.identityId,
        scheduleId: schedule.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        sourceRevision: schedule.version,
        idempotencyKey: `rebuild:${schedule.identityId}:${schedule.id}:${schedule.version}:create`,
      });

      const refreshed = await scheduleRepository.findByIdForIdentity(params.identityId, schedule.id);
      return (refreshed ?? schedule).toClientDTO();
    });

    return result;
  }

  async updateSchedule(
    id: string,
    identityId: string,
    params: {
      title?: string;
      startTime?: number;
      endTime?: number;
      description?: string;
      location?: string;
      priority?: number;
      attendees?: string[];
      expectedVersion: number;
    },
  ): Promise<CalendarEntryClientDTO> {
    if (params.expectedVersion === undefined || params.expectedVersion === null) {
      ScheduleEventApplicationService.invalidVersion();
    }

    const result = await this.withScheduleRepository(async (scheduleRepository) => {
      const conflictCacheService = new ScheduleConflictCacheService(scheduleRepository);
      const schedule = await scheduleRepository.findByIdForIdentity(identityId, id);
      if (!schedule) {
        ScheduleEventApplicationService.notFound(id);
      }

      if (schedule.version !== params.expectedVersion) {
        throw toResultErrorException(
          {
            code: 'CONFLICT',
            message: `Schedule event ${id} version conflict (expected ${params.expectedVersion}, current version is ${schedule.version})`,
            context: { currentVersion: schedule.version, expectedVersion: params.expectedVersion },
          },
          409,
        );
      }

      const previousStartTime = schedule.startTime;
      const previousEndTime = schedule.endTime;

      schedule.update({
        title: params.title,
        description: params.description,
        location: params.location,
        priority: params.priority,
        attendees: params.attendees,
        startTime: params.startTime,
        endTime: params.endTime,
      });

      await scheduleRepository.save(schedule, params.expectedVersion);

      const unionStart = Math.min(previousStartTime, schedule.startTime);
      const unionEnd = Math.max(previousEndTime, schedule.endTime);

      await conflictCacheService.refreshForTimeRange(
        schedule.identityId,
        unionStart,
        unionEnd,
      );

      await scheduleRepository.createRebuildOutbox({
        identityId: schedule.identityId,
        scheduleId: schedule.id,
        startTime: unionStart,
        endTime: unionEnd,
        sourceRevision: schedule.version,
        idempotencyKey: `rebuild:${schedule.identityId}:${schedule.id}:${schedule.version}:update`,
      });

      const refreshed = await scheduleRepository.findByIdForIdentity(identityId, id);
      return (refreshed ?? schedule).toClientDTO();
    });

    return result;
  }

  async deleteSchedule(id: string, identityId: string, expectedVersion: number): Promise<void> {
    if (expectedVersion === undefined || expectedVersion === null) {
      ScheduleEventApplicationService.invalidVersion();
    }

    await this.withScheduleRepository(async (scheduleRepository) => {
      const conflictCacheService = new ScheduleConflictCacheService(scheduleRepository);
      const schedule = await scheduleRepository.findByIdForIdentity(identityId, id);
      if (!schedule) {
        ScheduleEventApplicationService.notFound(id);
      }

      if (schedule.version !== expectedVersion) {
        throw toResultErrorException(
          {
            code: 'CONFLICT',
            message: `Schedule event ${id} version conflict (expected ${expectedVersion}, current version is ${schedule.version})`,
            context: { currentVersion: schedule.version, expectedVersion },
          },
          409,
        );
      }

      schedule.delete();
      await scheduleRepository.deleteAggregate(schedule, expectedVersion);
      await conflictCacheService.refreshForTimeRange(
        schedule.identityId,
        schedule.startTime,
        schedule.endTime,
      );

      await scheduleRepository.createRebuildOutbox({
        identityId: schedule.identityId,
        scheduleId: schedule.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        sourceRevision: schedule.version,
        idempotencyKey: `rebuild:${schedule.identityId}:${schedule.id}:${schedule.version}:delete`,
      });
    });
  }

  async getSchedule(id: string, identityId: string): Promise<CalendarEntryClientDTO | null> {
    const schedule = await this.scheduleRepository.findByIdForIdentity(identityId, id);
    return schedule ? schedule.toClientDTO() : null;
  }

  async getSchedulesByRange(
    identityId: string,
    startTime: number,
    endTime: number,
  ): Promise<CalendarEntryClientDTO[]> {
    const schedules = await this.scheduleRepository.findByTimeRange(identityId, startTime, endTime);
    return schedules.map((schedule) => schedule.toClientDTO());
  }

  private async withScheduleRepository<T>(
    work: (scheduleRepository: IScheduleRepository) => Promise<T>,
  ): Promise<T> {
    if (!this.scheduleRepository.withTransaction) {
      throw new Error('PowerSync / Schedule repository must provide withTransaction');
    }
    return this.scheduleRepository.withTransaction((scheduleRepository) => work(scheduleRepository));
  }
}
