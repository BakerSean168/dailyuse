import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import { aLoadedTaskTemplate, aTaskInstance } from '../../../../../testing';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../../domain/repositories/i-task-template-repository';
import { CompleteTaskInstanceUseCase } from '../complete-task-instance.use-case';
import { createInlineTaskWriteTransactionRunner } from '../task-write-support';

describe('CompleteTaskInstanceUseCase', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let useCase: CompleteTaskInstanceUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByIdForIdentity: vi.fn(),
      findByTemplateId: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
    });
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
    });
    useCase = new CompleteTaskInstanceUseCase(
      instanceRepo,
      templateRepo,
      createInlineTaskWriteTransactionRunner({
        instanceRepository: instanceRepo,
        templateRepository: templateRepo,
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws an error if transactionRunner is missing', () => {
    expect(
      () => new CompleteTaskInstanceUseCase(instanceRepo, templateRepo, undefined as any),
    ).toThrow('TaskWriteTransactionRunner must be explicitly provided to CompleteTaskInstanceUseCase');
  });

  it('should return NOT_FOUND when instance does not exist', async () => {
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('allows a skipped waiver to be corrected by a later Completed fact', async () => {
    const instance = await aTaskInstance();
    instance.skip('not applicable');
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    expect(instance.status).toBe('Completed');
    expect(instanceRepo.save).toHaveBeenCalledWith(instance);
  });

  it('allows an explicitly Missed occurrence to be corrected by late completion', async () => {
    const instance = await aTaskInstance();
    instance.markMissed('forgot yesterday');
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    expect(instance.status).toBe('Completed');
    expect(instanceRepo.save).toHaveBeenCalledWith(instance);
  });

  it('treats an already completed instance as an idempotent success', async () => {
    const instance = await aTaskInstance();
    instance.complete();
    const completeSpy = vi.spyOn(instance, 'complete');
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instance.id).toBe(instance.id);
      expect(result.data.instance.status).toBe('Completed');
    }
    expect(completeSpy).not.toHaveBeenCalled();
    expect(templateRepo.findByIdForIdentity).not.toHaveBeenCalled();
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should complete a Pending instance', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    expect(instance.status).toBe('Completed');
    expect(instanceRepo.save).toHaveBeenCalledWith(instance);
  });

  it('should complete an InProgress instance', async () => {
    const instance = await aTaskInstance();
    instance.start();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    expect(instance.status).toBe('Completed');
  });

  it('should pass duration, note, and rating to complete()', async () => {
    const instance = await aTaskInstance();
    const completeSpy = vi.spyOn(instance, 'complete');
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    await useCase.execute(instance.id, instance.identityId, {
      duration: 45,
      note: 'Great work',
      rating: 5,
    });

    expect(completeSpy).toHaveBeenCalledWith(45, 'Great work', 5, {
      taskTitle: '',
      goalBinding: null,
      allInstancesCompleted: false,
    });
  });

  it('includes the task goal binding in the completion event context', async () => {
    const template = aLoadedTaskTemplate({ title: 'Ship linked task' });
    template.bindToGoal('goal-1', 'kr-1', 2, TaskGoalBindingTrigger.PerInstance);
    const instance = await aTaskInstance({ templateId: template.id });
    const completeSpy = vi.spyOn(instance, 'complete');
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    await useCase.execute(instance.id, instance.identityId);

    expect(completeSpy).toHaveBeenCalledWith(undefined, undefined, undefined, {
      taskTitle: 'Ship linked task',
      goalBinding: template.goalBinding?.toDTO(),
      allInstancesCompleted: false,
    });
  });

  it('marks AllInstancesCompleted when all relevant sibling instances are completed', async () => {
    const template = aLoadedTaskTemplate({ title: 'Finish recurring work' });
    template.bindToGoal('goal-1', 'kr-1', 3, TaskGoalBindingTrigger.AllInstancesCompleted);
    const instance = await aTaskInstance({ templateId: template.id, instanceDate: 200 });
    const completedSibling = await aTaskInstance({ templateId: template.id, instanceDate: 100 });
    completedSibling.complete();
    const completeSpy = vi.spyOn(instance, 'complete');
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([completedSibling, instance]);
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    await useCase.execute(instance.id, instance.identityId);

    expect(completeSpy).toHaveBeenCalledWith(undefined, undefined, undefined, {
      taskTitle: 'Finish recurring work',
      goalBinding: template.goalBinding?.toDTO(),
      allInstancesCompleted: true,
    });
  });

  it('does not mark a finite plan complete while a future sibling is still pending', async () => {
    const template = aLoadedTaskTemplate({ title: 'Finish the complete plan' });
    template.bindToGoal('goal-1', 'kr-1', 3, TaskGoalBindingTrigger.AllInstancesCompleted);
    const instance = await aTaskInstance({ templateId: template.id, instanceDate: 200 });
    const completedSibling = await aTaskInstance({ templateId: template.id, instanceDate: 100 });
    const futurePendingSibling = await aTaskInstance({
      templateId: template.id,
      instanceDate: 300,
    });
    completedSibling.complete();
    const completeSpy = vi.spyOn(instance, 'complete');
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([
      completedSibling,
      instance,
      futurePendingSibling,
    ]);
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    await useCase.execute(instance.id, instance.identityId);

    expect(completeSpy).toHaveBeenCalledWith(undefined, undefined, undefined, {
      taskTitle: 'Finish the complete plan',
      goalBinding: template.goalBinding?.toDTO(),
      allInstancesCompleted: false,
    });
  });

  it('should return the instance client DTO in the response', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instance).toBeDefined();
      expect(result.data.instance.id).toBe(instance.id);
    }
  });
});
