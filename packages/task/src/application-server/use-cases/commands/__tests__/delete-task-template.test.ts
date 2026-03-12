import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aOneTimeTask, aLoadedTaskTemplate } from '@dailyuse/test-utils/fixtures';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { DeleteTaskTemplate } from '../delete-task-template';

// Mock eventBus — preserve all real exports (e.g. createIdType) while replacing eventBus
vi.mock('@dailyuse/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dailyuse/utils')>();
  return {
    ...actual,
    eventBus: { send: vi.fn() },
  };
});

import { eventBus } from '@dailyuse/utils';

describe('DeleteTaskTemplate', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let useCase: DeleteTaskTemplate;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      softDelete: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new DeleteTaskTemplate(templateRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return ok with success:true when template not found (idempotent)', async () => {
    vi.mocked(templateRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.success).toBe(true);
    }
    expect(templateRepo.delete).not.toHaveBeenCalled();
    expect(templateRepo.softDelete).not.toHaveBeenCalled();
  });

  it('should hard-delete when soft=false (default)', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(templateRepo.delete).toHaveBeenCalledWith(template.id);
    expect(templateRepo.softDelete).not.toHaveBeenCalled();
  });

  it('should soft-delete when soft=true', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id, true);

    expect(result).toBeOk();
    expect(templateRepo.softDelete).toHaveBeenCalledWith(template.id);
    expect(templateRepo.delete).not.toHaveBeenCalled();
  });

  it('should publish task:template:deleted event', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    await useCase.execute(template.id);

    expect(eventBus.send).toHaveBeenCalledWith(
      'task:template:deleted',
      expect.objectContaining({
        taskTemplateId: template.id,
        identityId: template.identityId,
        deletedAt: expect.any(Number),
      }),
    );
  });

  it('should not publish event when template not found', async () => {
    vi.mocked(templateRepo.findById).mockResolvedValue(null);

    await useCase.execute('non-existent');

    expect(eventBus.send).not.toHaveBeenCalled();
  });

  it('should not fail if event publishing throws', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(eventBus.send).mockImplementation(() => {
      throw new Error('Event bus down');
    });

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
  });

  it('should return success:true after delete', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOkWith({ success: true });
  });
});
