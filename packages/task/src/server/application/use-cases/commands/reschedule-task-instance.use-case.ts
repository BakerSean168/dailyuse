import type { RescheduleTaskInput, TaskInstanceClientDTO } from '@memoflow/contracts/task';
import { error, fail, ok, type Result } from '@memoflow/contracts/result';
import { asInstant, createTimeFacade } from '@memoflow/time';
import { TaskTimeConfig } from '../../../domain/value-objects/task-time-config';
import { buildTaskInstanceOccurrenceKey } from '../../../domain/value-objects/task-instance-occurrence-key';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import { mapTaskWriteErrorToResultError } from './task-write-support';

const time = createTimeFacade();

/** Owner command for one TaskOccurrence. It never mutates TaskTemplate or Scheduler persistence. */
export class RescheduleTaskInstanceUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(
    id: string,
    identityId: string,
    request: RescheduleTaskInput,
  ): Promise<Result<TaskInstanceClientDTO>> {
    try {
      const instance = await this.instanceRepository.findByIdForIdentity(identityId, id);
      if (!instance) return error('NOT_FOUND', `TaskInstance ${id} not found`);
      if (instance.version !== request.expectedVersion) {
        return error(
          'CONFLICT',
          `TaskInstance ${id} version conflict: expected ${request.expectedVersion}, current ${instance.version}`,
        );
      }
      if (!instance.canReschedule()) {
        return error('VALIDATION_ERROR', 'Cannot reschedule this task instance');
      }
      if (request.newTime.startDate == null) {
        return error('VALIDATION_ERROR', 'Rescheduled task requires startDate');
      }

      const targetDay = time.calendar.startOfDay(asInstant(request.newTime.startDate));
      const targetKey = buildTaskInstanceOccurrenceKey(
        String(instance.templateId),
        Number(targetDay),
      );
      const siblings = await this.instanceRepository.findByTemplateIdAndDateRange(
        String(instance.templateId),
        identityId,
        Number(targetDay),
        Number(time.calendar.endOfDay(targetDay)),
      );
      const collision = siblings.find(
        (candidate) => candidate.id !== instance.id && candidate.occurrenceKey === targetKey,
      );
      if (collision) {
        return error('CONFLICT', `Task occurrence already exists on target day (${collision.id})`);
      }

      const changed = instance.reschedule(
        TaskTimeConfig.fromDTO({ ...request.newTime, startDate: targetDay }),
      );
      if (!changed) return ok(instance.toClientDTO());
      await this.instanceRepository.save(instance);
      return ok(instance.toClientDTO());
    } catch (caughtError) {
      return fail(
        mapTaskWriteErrorToResultError(caughtError, 'Failed to reschedule task instance'),
      );
    }
  }
}
