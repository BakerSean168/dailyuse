import { toResultErrorException } from '@memoflow/contracts/result';
import type { CalendarEntryClientDTO } from '@memoflow/contracts/schedule';
import type { IdentityId } from '@memoflow/domain-shared';
import { CalendarEntry } from '../../domain/aggregates/calendar-entry';
import type { IScheduleRepository } from '../../domain/repositories/i-schedule-repository';
import { ScheduleConflictCacheService } from './schedule-conflict-cache-service';

/**
 * Schedule Event Application Service
 *
 * Responsibilities:
 * - Handle user-facing schedule event CRUD operations
 * - Coordinate domain logic
 * - DTO conversion
 */
export class ScheduleEventApplicationService {
  constructor(private scheduleRepository: IScheduleRepository) {}

  private static notFound(id: string): never {
    throw toResultErrorException(
      { code: 'NOT_FOUND', message: `Schedule event ${id} not found` },
      404,
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
    return this.withScheduleRepository(async (scheduleRepository) => {
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

      const refreshed = await scheduleRepository.findByIdForIdentity(params.identityId, schedule.id);
      return (refreshed ?? schedule).toClientDTO();
    });
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
    },
  ): Promise<CalendarEntryClientDTO> {
    return this.withScheduleRepository(async (scheduleRepository) => {
      const conflictCacheService = new ScheduleConflictCacheService(scheduleRepository);
      const schedule = await scheduleRepository.findByIdForIdentity(identityId, id);
      if (!schedule) {
        ScheduleEventApplicationService.notFound(id);
      }

      const previousStartTime = schedule.startTime;
      const previousEndTime = schedule.endTime;

      if (params.title !== undefined) schedule.updateTitle(params.title);
      if (params.description !== undefined) schedule.updateDescription(params.description);
      if (params.location !== undefined) schedule.updateLocation(params.location);
      if (params.priority !== undefined) schedule.updatePriority(params.priority);
      if (params.attendees !== undefined) schedule.updateAttendees(params.attendees);

      if (params.startTime !== undefined || params.endTime !== undefined) {
        schedule.reschedule(params.startTime ?? schedule.startTime, params.endTime ?? schedule.endTime);
      }

      await scheduleRepository.save(schedule);

      await conflictCacheService.refreshForTimeRange(
        schedule.identityId,
        Math.min(previousStartTime, schedule.startTime),
        Math.max(previousEndTime, schedule.endTime),
      );

      const refreshed = await scheduleRepository.findByIdForIdentity(identityId, id);
      return (refreshed ?? schedule).toClientDTO();
    });
  }

  async deleteSchedule(id: string, identityId: string): Promise<void> {
    await this.withScheduleRepository(async (scheduleRepository) => {
      const conflictCacheService = new ScheduleConflictCacheService(scheduleRepository);
      const schedule = await scheduleRepository.findByIdForIdentity(identityId, id);
      if (!schedule) {
        ScheduleEventApplicationService.notFound(id);
      }

      schedule.delete();
      await scheduleRepository.deleteAggregate(schedule);
      await conflictCacheService.refreshForTimeRange(
        schedule.identityId,
        schedule.startTime,
        schedule.endTime,
      );
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
    if (this.scheduleRepository.withTransaction) {
      return this.scheduleRepository.withTransaction((scheduleRepository) => work(scheduleRepository));
    }

    return work(this.scheduleRepository);
  }
}
