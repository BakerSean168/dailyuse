import type { IScheduleRepository } from '../../domain-server/repositories/IScheduleRepository';
import { CalendarEntry as DomainCalendarEntry } from '../../domain-server/aggregates/calendar-entry';
import type { CalendarEntryState } from '../../domain-server/aggregates/calendar-entry';
import type { ConflictDetectionResult, CalendarEntryServerDTO } from '@dailyuse/contracts/schedule';
import { ScheduleId } from '../../domain-shared/value-objects/schedule-id';

export class ScheduleConflictDetectionService {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  /**
   * Detect conflicts for a given schedule (by its server DTO).
   * - Loads other schedules in the same account that overlap the time window
   * - Uses the Domain Schedule aggregate to perform conflict detection
   */
  async detectConflictsForSchedule(scheduleDto: CalendarEntryServerDTO): Promise<ConflictDetectionResult> {
    const { identityId, startTime, endTime, id } = scheduleDto;

    // Parse timestamps
    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();

    // Validate time range
    if (startTimestamp >= endTimestamp) {
      throw new Error('Invalid time range: startTime must be before endTime');
    }

    // Find other schedules overlapping this time window (exclude the current schedule)
    const otherAggregates = await this.scheduleRepository.findByTimeRange(
      identityId,
      startTimestamp,
      endTimestamp,
      id,
    );

    // Reconstruct domain aggregate from DTO via load
    const state: CalendarEntryState = {
      id: ScheduleId.of(scheduleDto.id),
      identityId: scheduleDto.identityId,
      title: scheduleDto.title,
      description: scheduleDto.description ?? null,
      startTime: Number(scheduleDto.startTime),
      endTime: Number(scheduleDto.endTime),
      duration: scheduleDto.duration ?? Math.round((Number(scheduleDto.endTime) - Number(scheduleDto.startTime)) / 60000),
      hasConflict: scheduleDto.hasConflict ?? false,
      conflictingEntries: scheduleDto.conflictingEntries ? [...scheduleDto.conflictingEntries] : null,
      priority: scheduleDto.priority ?? null,
      location: scheduleDto.location ?? null,
      attendees: scheduleDto.attendees ? [...scheduleDto.attendees] : null,
      createdAt: new Date(scheduleDto.createdAt),
      updatedAt: new Date(scheduleDto.updatedAt),
    };
    const target = DomainCalendarEntry.load(state);

    // Perform conflict detection using domain logic
    const result = target.detectConflicts(otherAggregates);

    return result;
  }

  /**
   * Get conflicts for an existing schedule by its UUID.
   * Queries the schedule from repository and detects conflicts with other schedules
   * in the same time window.
   * 
   * @param scheduleId - UUID of the schedule to check for conflicts
   * @returns ConflictDetectionResult with detected conflicts and suggestions
   * @throws Error if schedule not found
   */
  async getScheduleConflicts(scheduleId: string): Promise<ConflictDetectionResult> {
    // Find the schedule (repository returns domain aggregate)
    const scheduleAggregate = await this.scheduleRepository.findById(scheduleId);
    
    if (!scheduleAggregate) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    // Convert aggregate to DTO for detectConflictsForSchedule method
    const scheduleDto = scheduleAggregate.toServerDTO();
    
    return this.detectConflictsForSchedule(scheduleDto);
  }
}

export default ScheduleConflictDetectionService;
