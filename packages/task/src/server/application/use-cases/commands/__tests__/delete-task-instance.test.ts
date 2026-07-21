import { describe, it, expect, vi } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { ITaskInstanceRepository } from '@/server/domain/repositories/i-task-instance-repository';
import { aTaskInstance } from '@/testing/task.fixture';

const { taskEventSend } = vi.hoisted(() => ({
  taskEventSend: vi.fn(),
}));

vi.mock('@dailyuse/utils/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dailyuse/utils/domain')>();
  return {
    ...actual,
    eventBus: {
      ...actual.eventBus,
      send: taskEventSend,
    },
    createTypedEventPublisher: (source: { send: typeof taskEventSend }) => ({
      send: source.send,
    }),
  };
});

import { DeleteTaskInstanceUseCase } from '../delete-task-instance.use-case';

describe('DeleteTaskInstanceUseCase', () => {
  function setup() {
    const instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteTaskInstanceUseCase(instanceRepo);
    return { useCase, instanceRepo };
  }

  it('should be idempotent when instance is missing or unowned', async () => {
    const { useCase, instanceRepo } = setup();

    const result = await useCase.execute('non-existent-id', 'identity-1');

    expect(result).toBeOk();
    expect(instanceRepo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'non-existent-id');
    expect(instanceRepo.delete).not.toHaveBeenCalled();
    expect(taskEventSend).not.toHaveBeenCalled();
  });

  it('should delete the owned instance and return ok', async () => {
    const { useCase, instanceRepo } = setup();
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    expect(instanceRepo.delete).toHaveBeenCalledWith(instance.identityId, instance.id);
    expect(instanceRepo.delete).toHaveBeenCalledTimes(1);
  });

  it('should publish task:instance-deleted when the instance exists', async () => {
    const { useCase, instanceRepo } = setup();
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    await useCase.execute(instance.id, instance.identityId);

    expect(taskEventSend).toHaveBeenCalledWith('task:instance-deleted', {
      identityId: instance.identityId,
      taskInstanceId: instance.id,
      taskTemplateId: instance.templateId,
      deletedAt: expect.any(Number),
    });
  });
});
