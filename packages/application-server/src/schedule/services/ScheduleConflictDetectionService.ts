import type { IScheduleRepository } from '@dailyuse/domain-server/schedule';
import { Schedule as DomainSchedule } from '@dailyuse/domain-server/schedule';
import type { ConflictDetectionResult, ScheduleServerDTO } from '@dailyuse/contracts/schedule';

export class ScheduleConflictDetectionService {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  /**
   * Detect conflicts for a given schedule (by its server DTO).
   * - Loads other schedules in the same account that overlap the time window
   * - Uses the Domain Schedule aggregate to perform conflict detection
   */
  async detectConflictsForSchedule(scheduleDto: ScheduleServerDTO): Promise<ConflictDetectionResult> {
    const { accountUuid, startTime, endTime, uuid } = scheduleDto;

    // Parse timestamps
    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();

    // Validate time range
    if (startTimestamp >= endTimestamp) {
      throw new Error('Invalid time range: startTime must be before endTime');
    }

    // Find other schedules overlapping this time window (exclude the current schedule)
    // Repository returns domain Schedule aggregates
    const otherAggregates = await this.scheduleRepository.findByTimeRange(
      accountUuid,
      startTimestamp,
      endTimestamp,
      uuid,
    );

    // Convert DTO to domain aggregate
    const target = DomainSchedule.fromServerDTO(scheduleDto);

    // Perform conflict detection using domain logic
    const result = target.detectConflicts(otherAggregates);

    return result;
  }

  /**
   * Get conflicts for an existing schedule by its UUID.
   * Queries the schedule from repository and detects conflicts with other schedules
   * in the same time window.
   * 
   * @param scheduleUuid - UUID of the schedule to check for conflicts
   * @returns ConflictDetectionResult with detected conflicts and suggestions
   * @throws Error if schedule not found
   */
  async getScheduleConflicts(scheduleUuid: string): Promise<ConflictDetectionResult> {
    // Find the schedule (repository returns domain aggregate)
    const scheduleAggregate = await this.scheduleRepository.findByUuid(scheduleUuid);
    
    if (!scheduleAggregate) {
      throw new Error(`Schedule not found: ${scheduleUuid}`);
    }

    // Convert aggregate to DTO for detectConflictsForSchedule method
    const scheduleDto = scheduleAggregate.toServerDTO();
    
    return this.detectConflictsForSchedule(scheduleDto);
  }
}

export default ScheduleConflictDetectionService;
