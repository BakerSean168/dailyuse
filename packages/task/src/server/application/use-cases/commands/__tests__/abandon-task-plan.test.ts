import { describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { TaskPlanOutcome, TaskTemplateStatus } from '@memoflow/contracts/task';
import type { ITaskTemplateRepository } from '../../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import { aOneTimeTask } from '../../../../../testing';
import { AbandonTaskPlanUseCase } from '../abandon-task-plan.use-case';
import { createInlineTaskWriteTransactionRunner } from '../task-write-support';

describe('AbandonTaskPlanUseCase (TASK-2202)', () => {
  it('closes the plan as explicitly Abandoned without using delete', async () => {
    const template = aOneTimeTask({ title: 'Try for 15 days' });
    const templateRepository = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(template),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const instanceRepository = createMockRepo<ITaskInstanceRepository>();
    const useCase = new AbandonTaskPlanUseCase(
      templateRepository,
      createInlineTaskWriteTransactionRunner({ templateRepository, instanceRepository }),
    );

    const result = await useCase.execute(template.id, template.identityId, {
      reason: 'User changed direction',
    });

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Closed);
    expect(template.outcome).toBe(TaskPlanOutcome.Abandoned);
    expect(template.abandonedReason).toBe('User changed direction');
    expect(template.deletedAt).toBeNull();
    expect(templateRepository.save).toHaveBeenCalledWith(template);
  });
});
