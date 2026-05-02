import type {
  CalendarEntryServerDTO,
  ConflictDetectionResult,
} from '@dailyuse/contracts/schedule';
import type { CalendarEntryState } from '../../domain-server/aggregates/calendar-entry';
import { CalendarEntry as DomainCalendarEntry } from '../../domain-server/aggregates/calendar-entry';
import type { IScheduleRepository } from '../../domain-server/repositories/IScheduleRepository';
import { ScheduleId } from '../../domain-shared/value-objects/schedule-id';

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
      throw new Error('Invalid time range: startTime must be before endTime');
    }

    const overlappingSchedules = await this.scheduleRepository.findByTimeRange(
      schedule.identityId,
      schedule.startTime,
      schedule.endTime,
      excludeId,
    );

    return schedule.detectConflicts(overlappingSchedules);
  }

  async getScheduleConflicts(scheduleId: string): Promise<ConflictDetectionResult> {
    const scheduleAggregate = await this.scheduleRepository.findById(scheduleId);

    if (!scheduleAggregate) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    return this.detectConflictsForEntry(scheduleAggregate);
  }

  private toAggregate(scheduleDto: CalendarEntryServerDTO): DomainCalendarEntry {
    return DomainCalendarEntry.load({
      id: scheduleDto.id ? ScheduleId.of(scheduleDto.id) : ScheduleId.generate(),
      identityId: scheduleDto.identityId,
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
      identityId: params.identityId,
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
