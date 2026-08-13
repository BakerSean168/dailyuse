import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { aLoadedTaskTemplate } from '../../../../../testing';
import type { ITaskTemplateRepository } from '../../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import { TaskTemplateStatus } from '@memoflow/contracts/task';
import { ActivateTaskTemplateUseCase } from '../activate-task-template.use-case';
import { createInlineTaskWriteTransactionRunner } from '../task-write-support';

const mockGenerateInstances = vi.fn().mockReturnValue([]);
vi.mock('../../../../domain/services', () => {
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
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      saveMany: vi.fn().mockResolvedValue(undefined),
    });

    useCase = new ActivateTaskTemplateUseCase(
      templateRepo,
      instanceRepo,
      createInlineTaskWriteTransactionRunner({
        templateRepository: templateRepo,
        instanceRepository: instanceRepo,
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws an error if transactionRunner is missing', () => {
    expect(
      () => new ActivateTaskTemplateUseCase(templateRepo, instanceRepo, undefined as any),
    ).toThrow('TaskWriteTransactionRunner must be explicitly provided to ActivateTaskTemplateUseCase');
  });

  it('should return NOT_FOUND when template does not exist', async () => {
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(templateRepo.save).not.toHaveBeenCalled();
  });

  it('should activate a paused template', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Active);
    expect(templateRepo.save).toHaveBeenCalledWith(template);
  });

  it('should return BAD_REQUEST when template cannot be activated from its current state', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeErrorWithCode('BAD_REQUEST');
    expect(templateRepo.save).not.toHaveBeenCalled();
  });

  it('should save template at least once after activating', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    await useCase.execute(template.id, template.identityId);

    expect(templateRepo.save).toHaveBeenCalled();
  });

  it('should generate instances after activation', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    await useCase.execute(template.id, template.identityId);

    expect(mockGenerateInstances).toHaveBeenCalledWith(template);
  });

  it('should save generated instances when there are some', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const fakeInstances = [{}, {}, {}];
    mockGenerateInstances.mockReturnValue(fakeInstances);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    expect(instanceRepo.saveMany).toHaveBeenCalledWith(fakeInstances);
    if (result.ok) {
      expect(result.data.instancesGenerated).toBe(3);
    }
  });

  it('should not save instances when none are generated', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
    mockGenerateInstances.mockReturnValue([]);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    expect(instanceRepo.saveMany).not.toHaveBeenCalled();
    if (result.ok) {
      expect(result.data.instancesGenerated).toBe(0);
    }
  });

  it('should return instancesGenerated count', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
    mockGenerateInstances.mockReturnValue([{}, {}, {}, {}, {}]);

    const result = await useCase.execute(template.id, template.identityId);

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
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.template).toBeDefined();
      expect(result.data.template.name).toBe('Reactivated Task');
    }
  });

  it('should return INTERNAL_ERROR when template persistence fails', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
    mockGenerateInstances.mockReturnValue([{}, {}]);
    vi.mocked(templateRepo.save).mockRejectedValueOnce(new Error('save failed'));

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeErrorWithCode('INTERNAL_ERROR');
  });
});
