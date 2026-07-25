import { toResultErrorException } from '@dailyuse/contracts/result';
import type {
  ConflictDetectionResult,
  CreateScheduleRequest,
  CreateScheduleResponseDTO,
  DetectConflictsInternalQuery,
  ResolveConflictRequest,
  ResolveConflictResponseDTO,
} from '@dailyuse/contracts/schedule';
import { ScheduleConflictDetectionService } from './schedule-conflict-detection-service';
import { ScheduleEventApplicationService } from './schedule-event-application-service';

/**
 * Schedule Conflict Resolution Service
 * 调度冲突解决应用服务
 */
export class ScheduleConflictResolutionService {
  constructor(
    private readonly scheduleEventService: ScheduleEventApplicationService,
    private readonly conflictDetectionService: ScheduleConflictDetectionService,
  ) {}

  async getConflicts(scheduleId: string, identityId: string): Promise<ConflictDetectionResult> {
    return this.conflictDetectionService.getScheduleConflicts(scheduleId, identityId);
  }

  async detectConflicts(
    query: DetectConflictsInternalQuery,
  ): Promise<ConflictDetectionResult> {
    return this.conflictDetectionService.detectConflictsForTimeRange({
      identityId: query.identityId,
      startTime: query.startTime,
      endTime: query.endTime,
      excludeId: query.excludeId,
    });
  }

  async createWithConflictDetection(
    request: CreateScheduleRequest,
    identityId: string,
  ): Promise<CreateScheduleResponseDTO> {
    const schedule = await this.scheduleEventService.createSchedule({
      identityId,
      title: request.name,
      startTime: request.startTime,
      endTime: request.endTime,
      description: request.description,
      location: request.location,
      priority: request.priority,
      attendees: request.attendees,
    });
    const conflicts = await this.conflictDetectionService.getScheduleConflicts(
      schedule.id,
      identityId,
    );

    return { schedule, conflicts };
  }

  async resolveConflict(
    scheduleId: string,
    request: ResolveConflictRequest,
    identityId: string,
  ): Promise<ResolveConflictResponseDTO> {
    const currentEvent = await this.scheduleEventService.getSchedule(scheduleId, identityId);
    if (!currentEvent) {
      throw toResultErrorException({ code: 'NOT_FOUND', message: '日程不存在' }, 404);
    }

    switch (request.resolution) {
      case 'REJECT':
        throw toResultErrorException(
          {
            code: 'CONFLICT_REJECTED',
            message: 'Schedule conflict was rejected by the user',
          },
          409,
        );

      case 'AUTO':
        return this.resolveAutomatically(scheduleId, currentEvent, identityId);

      case 'ADJUST_START_TIME':
        return this.adjustStartTime(scheduleId, currentEvent, identityId, request.newStartTime);

      case 'ADJUST_END_TIME':
        return this.adjustEndTime(scheduleId, currentEvent, identityId, request.newEndTime);

      case 'ADJUST_DURATION':
        return this.adjustDuration(scheduleId, currentEvent, identityId, request.newDuration);
    }
  }

  private async resolveAutomatically(
    scheduleId: string,
    currentEvent: ResolveConflictResponseDTO['schedule'],
    identityId: string,
  ): Promise<ResolveConflictResponseDTO> {
    const conflicts = await this.conflictDetectionService.getScheduleConflicts(
      scheduleId,
      identityId,
    );
    if (!conflicts.hasConflict || conflicts.suggestions.length === 0) {
      return this.noConflictResponse(currentEvent, conflicts, 'AUTO');
    }

    const suggestion = conflicts.suggestions[0];
    const schedule = await this.scheduleEventService.updateSchedule(scheduleId, identityId, {
      startTime: suggestion.newStartTime,
      endTime: suggestion.newEndTime,
    });

    return {
      schedule,
      conflicts,
      applied: {
        strategy: 'AUTO',
        previousStartTime: currentEvent.startTime,
        previousEndTime: currentEvent.endTime,
        changes: [
          `Auto-resolved using ${suggestion.type}: moved to ${suggestion.newStartTime}-${suggestion.newEndTime}`,
        ],
      },
    };
  }

  private async adjustStartTime(
    scheduleId: string,
    currentEvent: ResolveConflictResponseDTO['schedule'],
    identityId: string,
    newStartTime?: number,
  ): Promise<ResolveConflictResponseDTO> {
    const conflicts = await this.conflictDetectionService.getScheduleConflicts(
      scheduleId,
      identityId,
    );
    if (!conflicts.hasConflict) {
      return this.noConflictResponse(currentEvent, conflicts, 'ADJUST_START_TIME');
    }

    const latestOverlapEnd = Math.max(...conflicts.conflicts.map((conflict) => conflict.overlapEnd));
    const duration = currentEvent.endTime - currentEvent.startTime;
    const adjustedStartTime = newStartTime ?? latestOverlapEnd;
    const adjustedEndTime = adjustedStartTime + duration;
    const schedule = await this.scheduleEventService.updateSchedule(scheduleId, identityId, {
      startTime: adjustedStartTime,
      endTime: adjustedEndTime,
    });

    return {
      schedule,
      conflicts,
      applied: {
        strategy: 'ADJUST_START_TIME',
        previousStartTime: currentEvent.startTime,
        previousEndTime: currentEvent.endTime,
        changes: [`Adjusted start time from ${currentEvent.startTime} to ${adjustedStartTime}`],
      },
    };
  }

  private async adjustEndTime(
    scheduleId: string,
    currentEvent: ResolveConflictResponseDTO['schedule'],
    identityId: string,
    newEndTime?: number,
  ): Promise<ResolveConflictResponseDTO> {
    const conflicts = await this.conflictDetectionService.getScheduleConflicts(
      scheduleId,
      identityId,
    );
    if (!conflicts.hasConflict) {
      return this.noConflictResponse(currentEvent, conflicts, 'ADJUST_END_TIME');
    }

    const earliestOverlapStart = Math.min(
      ...conflicts.conflicts.map((conflict) => conflict.overlapStart),
    );
    const adjustedEndTime = newEndTime ?? earliestOverlapStart;
    if (adjustedEndTime <= currentEvent.startTime) {
      throw toResultErrorException(
        {
          code: 'VALIDATION_ERROR',
          message: 'Cannot adjust end time: would result in zero or negative duration',
        },
        422,
      );
    }

    const schedule = await this.scheduleEventService.updateSchedule(scheduleId, identityId, {
      endTime: adjustedEndTime,
    });

    return {
      schedule,
      conflicts,
      applied: {
        strategy: 'ADJUST_END_TIME',
        previousStartTime: currentEvent.startTime,
        previousEndTime: currentEvent.endTime,
        changes: [`Adjusted end time from ${currentEvent.endTime} to ${adjustedEndTime}`],
      },
    };
  }

  private async adjustDuration(
    scheduleId: string,
    currentEvent: ResolveConflictResponseDTO['schedule'],
    identityId: string,
    newDuration?: number,
  ): Promise<ResolveConflictResponseDTO> {
    const conflicts = await this.conflictDetectionService.getScheduleConflicts(
      scheduleId,
      identityId,
    );
    if (!conflicts.hasConflict) {
      return this.noConflictResponse(currentEvent, conflicts, 'ADJUST_DURATION');
    }

    const earliestOverlapStart = Math.min(
      ...conflicts.conflicts.map((conflict) => conflict.overlapStart),
    );
    const adjustedEndTime = newDuration
      ? currentEvent.startTime + newDuration * 60000
      : earliestOverlapStart;
    if (adjustedEndTime <= currentEvent.startTime) {
      throw toResultErrorException(
        {
          code: 'VALIDATION_ERROR',
          message: 'Cannot adjust duration: would result in zero or negative duration',
        },
        422,
      );
    }

    const schedule = await this.scheduleEventService.updateSchedule(scheduleId, identityId, {
      endTime: adjustedEndTime,
    });

    return {
      schedule,
      conflicts,
      applied: {
        strategy: 'ADJUST_DURATION',
        previousStartTime: currentEvent.startTime,
        previousEndTime: currentEvent.endTime,
        changes: [
          `Adjusted duration: end time changed from ${currentEvent.endTime} to ${adjustedEndTime}`,
        ],
      },
    };
  }

  private noConflictResponse(
    schedule: ResolveConflictResponseDTO['schedule'],
    conflicts: ConflictDetectionResult,
    strategy: ResolveConflictResponseDTO['applied']['strategy'],
  ): ResolveConflictResponseDTO {
    return {
      schedule,
      conflicts,
      applied: {
        strategy,
        changes: ['No conflicts to resolve'],
      },
    };
  }
}
