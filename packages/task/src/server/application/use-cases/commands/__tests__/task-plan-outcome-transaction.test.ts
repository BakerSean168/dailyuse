import { describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import {
  TaskPlanCompletionPolicy,
  TaskPlanOutcome,
  TaskTemplateStatus,
} from '@memoflow/contracts/task';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../../domain/repositories/i-task-template-repository';
import { aLoadedTaskTemplate, aTaskInstance } from '../../../../../testing';
import { MarkTaskInstanceMissedUseCase } from '../mark-task-instance-missed.use-case';
import { CompleteTaskInstanceUseCase } from '../complete-task-instance.use-case';
import { createInlineTaskWriteTransactionRunner } from '../task-write-support';

describe('Task plan outcome transaction integration (TASK-2202)', () => {
  it('explicit Missed -> strict Failed, then late completion correction -> Succeeded in the same write runner', async () => {
    const template = aLoadedTaskTemplate({
      completionPolicy: TaskPlanCompletionPolicy.StrictNoBackfill,
    });
    const instance = await aTaskInstance({
      templateId: template.id,
      identityId: template.identityId,
    });

    const templateRepository = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(template),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const instanceRepository = createMockRepo<ITaskInstanceRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(instance),
      findByTemplateId: vi.fn().mockResolvedValue([instance]),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const runner = createInlineTaskWriteTransactionRunner({ templateRepository, instanceRepository });

    const missed = await new MarkTaskInstanceMissedUseCase(instanceRepository, runner).execute(
      instance.id,
      instance.identityId,
      { reason: 'day not completed' },
    );
    expect(missed).toBeOk();
    expect(template.outcome).toBe(TaskPlanOutcome.Failed);
    expect(template.status).toBe(TaskTemplateStatus.Closed);
    expect(templateRepository.save).toHaveBeenCalledWith(template);

    vi.mocked(templateRepository.save).mockClear();
    const corrected = await new CompleteTaskInstanceUseCase(
      instanceRepository,
      templateRepository,
      runner,
    ).execute(instance.id, instance.identityId);

    expect(corrected).toBeOk();
    expect(template.outcome).toBe(TaskPlanOutcome.Succeeded);
    expect(template.status).toBe(TaskTemplateStatus.Closed);
    expect(templateRepository.save).toHaveBeenCalledWith(template);
  });
});
