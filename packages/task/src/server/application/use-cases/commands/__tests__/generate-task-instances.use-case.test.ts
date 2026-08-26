import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { TaskType } from '@memoflow/contracts/task';
import {
  aDailyRecurrenceRule,
  aLoadedTaskTemplate,
  anAllDayTimeConfig,
  aTaskInstance,
} from '../../../../../testing';
import type { ITaskTemplateRepository } from '../../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import { GenerateTaskInstancesUseCase } from '../generate-task-instances.use-case';
import { createInlineTaskWriteTransactionRunner } from '../task-write-support';

describe('GenerateTaskInstancesUseCase (TASK-2204)', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: GenerateTaskInstancesUseCase;

  beforeEach(() => {
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByTemplateId: vi.fn().mockResolvedValue([]),
      saveMany: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new GenerateTaskInstancesUseCase(
      templateRepo,
      instanceRepo,
      createInlineTaskWriteTransactionRunner({
        templateRepository: templateRepo,
        instanceRepository: instanceRepo,
      }),
    );
  });

  it('filters already persisted occurrence days before returning generated DTOs', async () => {
    const start = new Date(2026, 0, 1, 0, 0, 0).getTime();
    const secondDay = new Date(2026, 0, 2, 0, 0, 0).getTime();
    const timeConfig = anAllDayTimeConfig(new Date(start));
    const template = aLoadedTaskTemplate({
      taskType: TaskType.Recurring,
      timeConfig,
      recurrenceRule: aDailyRecurrenceRule(),
      lastGeneratedDate: null,
    });
    const existing = await aTaskInstance({
      templateId: template.id,
      identityId: template.identityId,
      instanceDate: start,
      timeConfig,
    });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([existing]);

    const result = await useCase.execute(String(template.id), String(template.identityId), {
      fromDate: start,
      toDate: new Date(2026, 0, 2, 23, 59, 59, 999).getTime(),
    });

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.map((instance) => instance.instanceDate)).toEqual([secondDay]);
    }
    expect(instanceRepo.saveMany).toHaveBeenCalledTimes(1);
    expect(vi.mocked(instanceRepo.saveMany).mock.calls[0][0]).toHaveLength(1);
  });
});
