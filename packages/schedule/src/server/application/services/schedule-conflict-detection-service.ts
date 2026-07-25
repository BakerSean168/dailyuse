import { toResultErrorException } from '@dailyuse/contracts/result';
import type {
  CalendarEntryServerDTO,
  ConflictDetectionResult,
} from '@dailyuse/contracts/schedule';
import type { CalendarEntryState } from '../../domain/aggregates/calendar-entry';
import { CalendarEntry as DomainCalendarEntry } from '../../domain/aggregates/calendar-entry';
import type { IScheduleRepository } from '../../domain/repositories/i-schedule-repository';
import { ScheduleId } from '../../domain/value-objects/schedule-id';
import type { IdentityId } from '@dailyuse/domain-shared';

export class ScheduleConflictDetectionService {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  async detectConflictsForSchedule(
    scheduleDto: CalendarEntryServerDTO,
  ): Promise<ConflictDetectionResult> {
    return this.detectConflictsForEntry(this.toAggregate(scheduleDto), scheduleDto.id);
  }

  async detectConflictsForTimeRange(params: {
    identityId: string;
    startTime: number;
    endTime: number;
    excludeId?: string;
  }): Promise<ConflictDetectionResult> {
    const transientEntry = DomainCalendarEntry.load(this.toTransientState(params));
    return this.detectConflictsForEntry(transientEntry, params.excludeId);
  }

  async detectConflictsForEntry(
    schedule: DomainCalendarEntry,
    excludeId: string | undefined = schedule.id,
  ): Promise<ConflictDetectionResult> {
    if (schedule.startTime >= schedule.endTime) {
      throw toResultErrorException(
        { code: 'VALIDATION_ERROR', message: 'Invalid time range: startTime must be before endTime' },
        422,
      );
    }

    const overlappingSchedules = await this.scheduleRepository.findByTimeRange(
      schedule.identityId,
      schedule.startTime,
      schedule.endTime,
      excludeId,
    );

    return schedule.detectConflicts(overlappingSchedules);
  }

  async getScheduleConflicts(
    scheduleId: string,
    identityId: string,
  ): Promise<ConflictDetectionResult> {
    const scheduleAggregate = await this.scheduleRepository.findByIdForIdentity(
      identityId,
      scheduleId,
    );

    if (!scheduleAggregate) {
      throw toResultErrorException(
        { code: 'NOT_FOUND', message: `Schedule not found: ${scheduleId}` },
        404,
      );
    }

    return this.detectConflictsForEntry(scheduleAggregate);
  }

  private toAggregate(scheduleDto: CalendarEntryServerDTO): DomainCalendarEntry {
    return DomainCalendarEntry.load({
      id: scheduleDto.id ? ScheduleId.of(scheduleDto.id) : ScheduleId.generate(),
      identityId: scheduleDto.identityId as IdentityId,
      title: scheduleDto.title,
      description: scheduleDto.description ?? null,
      startTime: Number(scheduleDto.startTime),
      endTime: Number(scheduleDto.endTime),
      duration:
        scheduleDto.duration ??
        Math.round((Number(scheduleDto.endTime) - Number(scheduleDto.startTime)) / 60000),
      hasConflict: scheduleDto.hasConflict ?? false,
      conflictingEntries: scheduleDto.conflictingEntries ? [...scheduleDto.conflictingEntries] : null,
      priority: scheduleDto.priority ?? null,
      location: scheduleDto.location ?? null,
      attendees: scheduleDto.attendees ? [...scheduleDto.attendees] : null,
      createdAt: new Date(scheduleDto.createdAt),
      updatedAt: new Date(scheduleDto.updatedAt),
    });
  }

  private toTransientState(params: {
    identityId: string;
    startTime: number;
    endTime: number;
    excludeId?: string;
  }): CalendarEntryState {
    const now = new Date();
    return {
      id: ScheduleId.generate(),
      identityId: params.identityId as IdentityId,
      title: 'Conflict check',
      description: null,
      startTime: params.startTime,
      endTime: params.endTime,
      duration: Math.max(Math.round((params.endTime - params.startTime) / 60000), 0),
      hasConflict: false,
      conflictingEntries: null,
      priority: null,
      location: null,
      attendees: null,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export default ScheduleConflictDetectionService;
