import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aLoadedTaskTemplate, aRecurringTask } from '@dailyuse/task/testing';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/i-task-instance-repository';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { ActivateTaskTemplateUseCase } from '../activate-task-template.use-case';

// Mock TaskInstanceGenerationService — provide a constructor mock
const mockGenerateInstances = vi.fn().mockReturnValue([]);
vi.mock('@/domain-server/services/index', () => {
  return {
    TaskInstanceGenerationService: class {
      generateInstances = mockGenerateInstances;
      shouldRefillInstances = vi.fn().mockReturnValue(false);
      calculateRefillTargetDate = vi.fn().mockReturnValue(Date.now());
    },
  };
});

describe('ActivateTaskTemplateUseCase', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: ActivateTaskTemplateUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGenerateInstances.mockReturnValue([]);

    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      saveMany: vi.fn().mockResolvedValue(undefined),
    });

    useCase = new ActivateTaskTemplateUseCase(templateRepo, instanceRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return NOT_FOUND when template does not exist', async () => {
    vi.mocked(templateRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(templateRepo.save).not.toHaveBeenCalled();
  });

  it('should activate a paused template', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Active);
    expect(templateRepo.save).toHaveBeenCalledWith(template);
  });

  it('should save template at least once after activating', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    await useCase.execute(template.id);

    // First save after activate(), possibly second save after instance generation
    expect(templateRepo.save).toHaveBeenCalled();
  });

  it('should generate instances after activation', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    await useCase.execute(template.id);

    expect(mockGenerateInstances).toHaveBeenCalledWith(template);
  });

  it('should save generated instances when there are some', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    // Return fake instances
    const fakeInstances = [{}, {}, {}]; // stand-in objects
    mockGenerateInstances.mockReturnValue(fakeInstances);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(instanceRepo.saveMany).toHaveBeenCalledWith(fakeInstances);
    if (result.ok) {
      expect(result.data.instancesGenerated).toBe(3);
    }
  });

  it('should not save instances when none are generated', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    mockGenerateInstances.mockReturnValue([]);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(instanceRepo.saveMany).not.toHaveBeenCalled();
    if (result.ok) {
      expect(result.data.instancesGenerated).toBe(0);
    }
  });

  it('should return instancesGenerated count', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    mockGenerateInstances.mockReturnValue([{}, {}, {}, {}, {}]);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instancesGenerated).toBe(5);
    }
  });

  it('should return the template client DTO', async () => {
    const template = aLoadedTaskTemplate({
      status: TaskTemplateStatus.Paused,
      title: 'Reactivated Task',
    });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.template).toBeDefined();
      expect(result.data.template.name).toBe('Reactivated Task');
    }
  });
});
