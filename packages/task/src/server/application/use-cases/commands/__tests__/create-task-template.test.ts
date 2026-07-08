import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@/testing';
import type { ITaskTemplateRepository } from '@/server/domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '@/server/domain/repositories/i-task-instance-repository';
import type { CreateTaskTemplateUseCaseReq } from '@dailyuse/contracts/task';
import { TaskGoalBindingTrigger, TaskType } from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { CreateTaskTemplateUseCase } from '../create-task-template.use-case';

vi.mock('@dailyuse/utils', async () => {
  const actual = await vi.importActual<typeof import('@dailyuse/utils')>('@dailyuse/utils');
  return {
    ...actual,
    createLogger: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      setLevel: vi.fn(),
      addTransport: vi.fn(),
      child: vi.fn(),
    })),
  };
});

const mockGenerateInstances = vi.fn().mockReturnValue([]);
vi.mock('@/server/domain/services/index', () => {
  return {
    TaskInstanceGenerationService: class {
      generateInstances = mockGenerateInstances;
      shouldRefillInstances = vi.fn().mockReturnValue(false);
      calculateRefillTargetDate = vi.fn().mockReturnValue(Date.now());
    },
  };
});

describe('CreateTaskTemplateUseCase', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: CreateTaskTemplateUseCase;

  function aCreateRequest(overrides: Partial<CreateTaskTemplateUseCaseReq> = {}): CreateTaskTemplateUseCaseReq {
    return {
      identityId: anIdentityId(),
      name: 'Test Task',
      taskType: TaskType.OneTime,
      timeConfig: {
        timeType: 'AllDay',
        startDate: Date.now(),
        timePoint: null,
        timeRange: null,
      },
      importance: ImportanceLevel.Moderate,
      tags: [],
      ...overrides,
    } as CreateTaskTemplateUseCaseReq;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGenerateInstances.mockReturnValue([]);

    templateRepo = createMockRepo<ITaskTemplateRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      saveMany: vi.fn().mockResolvedValue(undefined),
    });

    useCase = new CreateTaskTemplateUseCase(templateRepo, instanceRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a one-time task template', async () => {
    const request = aCreateRequest({ name: 'Buy groceries', taskType: TaskType.OneTime });

    const result = await useCase.execute(request);

    expect(result).toBeOk();
    expect(templateRepo.save).toHaveBeenCalled();
    if (result.ok) {
      expect(result.data.template.name).toBe('Buy groceries');
    }
  });

  it('should save the template to the repository', async () => {
    const request = aCreateRequest();

    await useCase.execute(request);

    expect(templateRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should persist goal binding on the created template', async () => {
    const request = aCreateRequest({
      goalBinding: {
        goalId: 'goal-1',
        keyResultId: 'kr-1',
        goalRecordValue: 2,
        progressTrigger: TaskGoalBindingTrigger.AllInstancesCompleted,
      },
    });

    await useCase.execute(request);

    expect(templateRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        goalBinding: expect.objectContaining({
          goalId: 'goal-1',
          keyResultId: 'kr-1',
          goalRecordValue: 2,
          progressTrigger: TaskGoalBindingTrigger.AllInstancesCompleted,
        }),
      }),
    );
  });

  it('should create a recurring task template', async () => {
    const request = aCreateRequest({
      name: 'Daily standup',
      taskType: TaskType.Recurring,
      recurrenceRule: {
        frequency: 'Daily',
        interval: 1,
        daysOfWeek: [],
        endDate: null,
        occurrences: null,
      },
    });

    const result = await useCase.execute(request);

    expect(result).toBeOk();
  });

  it('should use provided description', async () => {
    const request = aCreateRequest({
      name: 'Task with desc',
      description: 'A detailed description',
    });

    const result = await useCase.execute(request);

    expect(result).toBeOk();
  });

  it('should use provided importance level', async () => {
    const request = aCreateRequest({
      importance: ImportanceLevel.Vital,
    });

    const result = await useCase.execute(request);

    expect(result).toBeOk();
  });

  it('should use provided tags', async () => {
    const request = aCreateRequest({
      tags: ['work', 'urgent'],
    });

    const result = await useCase.execute(request);

    expect(result).toBeOk();
  });

  it('should use provided color', async () => {
    const request = aCreateRequest({
      color: '#FF5500',
    });

    const result = await useCase.execute(request);

    expect(result).toBeOk();
  });

  describe('instance generation for Active templates', () => {
    it('should generate instances when template is Active', async () => {
      const fakeInstances = [{}, {}, {}];
      mockGenerateInstances.mockReturnValue(fakeInstances);
      const request = aCreateRequest({
        taskType: TaskType.Recurring,
        recurrenceRule: {
          frequency: 'Daily',
          interval: 1,
          daysOfWeek: [],
          endDate: null,
          occurrences: null,
        },
      });

      const result = await useCase.execute(request);

      expect(result).toBeOk();
      if (result.ok) {
        expect(result.data.instanceCount).toBe(3);
      }
    });

    it('should save generated instances', async () => {
      const fakeInstances = [{}, {}];
      mockGenerateInstances.mockReturnValue(fakeInstances);
      const request = aCreateRequest();

      await useCase.execute(request);

      expect(instanceRepo.saveMany).toHaveBeenCalledWith(fakeInstances);
    });

    it('should return instanceCount=0 when no instances generated', async () => {
      mockGenerateInstances.mockReturnValue([]);
      const request = aCreateRequest();

      const result = await useCase.execute(request);

      expect(result).toBeOk();
      if (result.ok) {
        expect(result.data.instanceCount).toBe(0);
      }
    });

    it('should save generated instances when instances are generated', async () => {
      const fakeInstances = [{}, {}, {}, {}, {}];
      mockGenerateInstances.mockReturnValue(fakeInstances);
      const request = aCreateRequest();

      await useCase.execute(request);

      expect(instanceRepo.saveMany).toHaveBeenCalledWith(fakeInstances);
    });

    it('should not save instances when no instances are generated', async () => {
      mockGenerateInstances.mockReturnValue([]);
      const request = aCreateRequest();

      await useCase.execute(request);

      expect(instanceRepo.saveMany).not.toHaveBeenCalled();
    });

    it('should return INTERNAL_ERROR when instance generation fails', async () => {
      mockGenerateInstances.mockImplementation(() => {
        throw new Error('Generation failed');
      });
      const request = aCreateRequest();

      const result = await useCase.execute(request);

      expect(result).toBeErrorWithCode('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR when persisting generated instances fails', async () => {
      const fakeInstances = [{}, {}];
      mockGenerateInstances.mockReturnValue(fakeInstances);
      vi.mocked(instanceRepo.saveMany).mockRejectedValue(new Error('DB error'));
      const request = aCreateRequest();

      const result = await useCase.execute(request);

      expect(result).toBeErrorWithCode('INTERNAL_ERROR');
    });
  });

  it('should return the template client DTO', async () => {
    const request = aCreateRequest({ name: 'My New Task' });

    const result = await useCase.execute(request);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.template).toBeDefined();
      expect(result.data.template.name).toBe('My New Task');
      expect(result.data.template.id).toBeDefined();
    }
  });
});
