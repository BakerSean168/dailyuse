import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aLoadedTaskTemplate, aTaskInstance } from '@dailyuse/test-utils/fixtures';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { PauseTaskTemplate } from '../pause-task-template';

// Mock eventBus — preserve all real exports (e.g. createIdType) while replacing eventBus
vi.mock('@dailyuse/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dailyuse/utils')>();
  return {
    ...actual,
    eventBus: { send: vi.fn() },
  };
});

import { eventBus } from '@dailyuse/utils';

describe('PauseTaskTemplate', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: PauseTaskTemplate;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByTemplateId: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new PauseTaskTemplate(templateRepo, instanceRepo);
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

  it('should pause an active template', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Paused);
    expect(templateRepo.save).toHaveBeenCalledWith(template);
  });

  it('should skip pending instances when pausing', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    const pendingInstance = await aTaskInstance({ templateId: template.id as any });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([pendingInstance]);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(pendingInstance.status).toBe('Skipped');
    expect(instanceRepo.save).toHaveBeenCalledWith(pendingInstance);
  });

  it('should skip in-progress instances when pausing', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    const inProgressInstance = await aTaskInstance({ templateId: template.id as any });
    inProgressInstance.start();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([inProgressInstance]);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(inProgressInstance.status).toBe('Skipped');
  });

  it('should not skip completed or already-skipped instances', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    const completedInstance = await aTaskInstance({ templateId: template.id as any });
    completedInstance.complete();
    const skippedInstance = await aTaskInstance({ templateId: template.id as any });
    skippedInstance.skip('Already skipped');
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([
      completedInstance,
      skippedInstance,
    ]);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instancesSkipped).toBe(0);
    }
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should return correct count of skipped instances', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    const inst1 = await aTaskInstance({ templateId: template.id as any });
    const inst2 = await aTaskInstance({ templateId: template.id as any });
    const inst3 = await aTaskInstance({ templateId: template.id as any });
    inst3.complete(); // this one shouldn't be skipped
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([inst1, inst2, inst3]);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instancesSkipped).toBe(2);
    }
  });

  it('should return 0 skipped instances when there are none', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([]);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instancesSkipped).toBe(0);
    }
  });

  describe('event publishing', () => {
    it('should publish task:template:paused event', async () => {
      const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
      vi.mocked(templateRepo.findById).mockResolvedValue(template);

      await useCase.execute(template.id, 'Taking a break');

      expect(eventBus.send).toHaveBeenCalledWith(
        'task:template:paused',
        expect.objectContaining({
          taskTemplateId: template.id,
          identityId: template.identityId,
          pausedAt: expect.any(Number),
          reason: 'Taking a break',
        }),
      );
    });

    it('should use default reason when none provided', async () => {
      const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
      vi.mocked(templateRepo.findById).mockResolvedValue(template);

      await useCase.execute(template.id);

      expect(eventBus.send).toHaveBeenCalledWith(
        'task:template:paused',
        expect.objectContaining({
          reason: expect.any(String),
        }),
      );
    });

    it('should not fail if event publishing throws', async () => {
      const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
      vi.mocked(templateRepo.findById).mockResolvedValue(template);
      vi.mocked(eventBus.send).mockImplementation(() => {
        throw new Error('Event bus down');
      });

      const result = await useCase.execute(template.id);

      expect(result).toBeOk();
    });
  });

  it('should return the template client DTO', async () => {
    const template = aLoadedTaskTemplate({
      status: TaskTemplateStatus.Active,
      title: 'My Paused Task',
    });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.template).toBeDefined();
      expect(result.data.template.name).toBe('My Paused Task');
    }
  });

  it('should handle instance processing errors gracefully', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute(template.id);

    // Pause itself should still succeed, instance errors are caught
    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instancesSkipped).toBe(0);
    }
  });
});
