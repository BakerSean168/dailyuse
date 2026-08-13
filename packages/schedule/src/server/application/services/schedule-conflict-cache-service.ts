import type { CalendarEntry } from '../../domain/aggregates/calendar-entry';
import type { IScheduleRepository } from '../../domain/repositories/i-schedule-repository';
import { ScheduleConflictDetectionService } from './schedule-conflict-detection-service';

export class ScheduleConflictCacheService {
  private readonly conflictDetectionService: ScheduleConflictDetectionService;

  constructor(private readonly scheduleRepository: IScheduleRepository) {
    this.conflictDetectionService = new ScheduleConflictDetectionService(scheduleRepository);
  }

  async refreshForTimeRange(
    identityId: string,
    startTime: number,
    endTime: number,
    targetScheduleId?: string,
    sourceRevision?: number,
  ): Promise<void> {
    const impactedSchedules = await this.scheduleRepository.findByTimeRange(
      identityId,
      startTime,
      endTime,
    );

    for (const schedule of impactedSchedules) {
      const explicitRev =
        targetScheduleId && schedule.id === targetScheduleId && sourceRevision !== undefined
          ? sourceRevision
          : schedule.version;
      await this.refreshSchedule(schedule, explicitRev);
    }
  }

  async refreshSchedule(schedule: CalendarEntry, sourceRevision?: number): Promise<void> {
    const result = await this.conflictDetectionService.detectConflictsForEntry(schedule);
    const conflictingIds = result.hasConflict
      ? result.conflicts.map((conflict) => conflict.scheduleId)
      : null;

    await this.scheduleRepository.updateConflictProjection(
      schedule.identityId,
      schedule.id,
      result.hasConflict,
      conflictingIds,
      sourceRevision ?? schedule.version,
    );
  }
}
