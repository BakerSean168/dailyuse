import type { CalendarEntry } from '../../domain-server/aggregates/calendar-entry';
import type { IScheduleRepository } from '../../domain-server/repositories/i-schedule-repository';
import { ScheduleConflictDetectionService } from './schedule-conflict-detection-service';

export class ScheduleConflictCacheService {
  private readonly conflictDetectionService: ScheduleConflictDetectionService;

  constructor(private readonly scheduleRepository: IScheduleRepository) {
    this.conflictDetectionService = new ScheduleConflictDetectionService(scheduleRepository);
  }

  async refreshForTimeRange(identityId: string, startTime: number, endTime: number): Promise<void> {
    const impactedSchedules = await this.scheduleRepository.findByTimeRange(
      identityId,
      startTime,
      endTime,
    );

    for (const schedule of impactedSchedules) {
      await this.refreshSchedule(schedule);
    }
  }

  async refreshSchedule(schedule: CalendarEntry): Promise<void> {
    const result = await this.conflictDetectionService.detectConflictsForEntry(schedule);

    if (result.hasConflict) {
      schedule.markAsConflicting(result.conflicts.map((conflict) => conflict.scheduleId));
    } else if (schedule.hasConflict) {
      schedule.clearConflicts();
    }

    await this.scheduleRepository.save(schedule);
  }
}
