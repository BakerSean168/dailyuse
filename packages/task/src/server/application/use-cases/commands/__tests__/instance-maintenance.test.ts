import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { ITaskTemplateRepository } from '../../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import { aLoadedTaskTemplate } from '../../../../../testing';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { InvalidTaskTemplateStateError } from '../../../../domain/value-objects/task-errors';
import { CheckExpiredInstancesUseCase } from '../check-expired-instances.use-case';
import { GenerateTaskInstancesUseCase } from '../generate-task-instances.use-case';

const mockMarkExpiredInstances = vi.fn();
const mockGenerateInstances = vi.fn();
vi.mock('../../../../domain/services', () => {
  return {
    TaskExpirationService: class {
      markExpiredInstances = mockMarkExpiredInstances;
    },
    TaskInstanceGenerationService: class {
      generateInstances = mockGenerateInstances;
    },
  };
});

describe('Instance maintenance use-cases', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkExpiredInstances.mockReturnValue([]);
    mockGenerateInstances.mockReturnValue([]);

    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });

    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([]),
      saveMany: vi.fn().mockResolvedValue(undefined),
    });
  });

  describe('CheckExpiredInstancesUseCase', () => {
    it('returns expired DTO list and saves when there are expired instances', async () => {
      const sourceInstances = [{ id: 'i-source' } as any];
      const expired = [{ toClientDTO: vi.fn().mockReturnValue({ id: 'i-expired' }) } as any];
      vi.mocked(instanceRepo.findByIdentityId).mockResolvedValue(sourceInstances as any);
      mockMarkExpiredInstances.mockReturnValue(expired);

      const useCase = new CheckExpiredInstancesUseCase(instanceRepo);
      const result = await useCase.execute('identity-1');

      expect(result).toBeOk();
      expect(instanceRepo.findByIdentityId).toHaveBeenCalledWith('identity-1');
      expect(mockMarkExpiredInstances).toHaveBeenCalledWith(sourceInstances);
      expect(instanceRepo.saveMany).toHaveBeenCalledWith(expired);
      expect(result).toBeOkWith([{ id: 'i-expired' }] as any);
    });

    it('does not persist when no expired instances are found', async () => {
      vi.mocked(instanceRepo.findByIdentityId).mockResolvedValue([{ id: 'i1' } as any]);
      mockMarkExpiredInstances.mockReturnValue([]);

      const useCase = new CheckExpiredInstancesUseCase(instanceRepo);
      const result = await useCase.execute('identity-1');

      expect(result).toBeOkWith([] as any);
      expect(instanceRepo.saveMany).not.toHaveBeenCalled();
    });
  });

  describe('GenerateTaskInstancesUseCase', () => {
    it('returns NOT_FOUND when template does not exist', async () => {
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(null);
      const useCase = new GenerateTaskInstancesUseCase(templateRepo, instanceRepo);

      const result = await useCase.execute('tpl-404', 'identity-1', {
        fromDate: 0,
        toDate: Date.now(),
      });

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(mockGenerateInstances).not.toHaveBeenCalled();
      expect(instanceRepo.saveMany).not.toHaveBeenCalled();
      expect(templateRepo.save).not.toHaveBeenCalled();
    });

    it('returns empty list without persisting when generator yields none', async () => {
      const template = { id: 'tpl-1' } as any;
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
      mockGenerateInstances.mockReturnValue([]);
      const useCase = new GenerateTaskInstancesUseCase(templateRepo, instanceRepo);

      const result = await useCase.execute('tpl-1', 'identity-1', {
        fromDate: 1,
        toDate: 2,
      });

      expect(result).toBeOkWith([] as any);
      expect(mockGenerateInstances).toHaveBeenCalledWith(template, {
        forceGenerate: true,
        targetDate: 2,
      });
      expect(instanceRepo.saveMany).not.toHaveBeenCalled();
      expect(templateRepo.save).not.toHaveBeenCalled();
    });

    it('persists generated instances and returns DTO list', async () => {
      const template = { id: 'tpl-1' } as any;
      const generated = [
        { toClientDTO: vi.fn().mockReturnValue({ id: 'i-1' }) },
        { toClientDTO: vi.fn().mockReturnValue({ id: 'i-2' }) },
      ];
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
      mockGenerateInstances.mockReturnValue(generated as any);
      const useCase = new GenerateTaskInstancesUseCase(templateRepo, instanceRepo);

      const result = await useCase.execute('tpl-1', 'identity-1', {
        fromDate: 10,
        toDate: 20,
      });

      expect(result).toBeOkWith([{ id: 'i-1' }, { id: 'i-2' }] as any);
      expect(instanceRepo.saveMany).toHaveBeenCalledWith(generated);
      expect(templateRepo.save).toHaveBeenCalledWith(template);
    });

    it('returns BAD_REQUEST when the template cannot generate instances in its current state', async () => {
      const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
      mockGenerateInstances.mockImplementation(() => {
        throw new InvalidTaskTemplateStateError('Can only generate instances for active templates');
      });
      const useCase = new GenerateTaskInstancesUseCase(templateRepo, instanceRepo);

      const result = await useCase.execute(template.id, template.identityId, {
        fromDate: 10,
        toDate: 20,
      });

      expect(result).toBeErrorWithCode('BAD_REQUEST');
      expect(instanceRepo.saveMany).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_ERROR when template persistence fails after generating instances', async () => {
      const template = aLoadedTaskTemplate();
      const generated = [{ toClientDTO: vi.fn().mockReturnValue({ id: 'i-1' }) }];
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
      mockGenerateInstances.mockReturnValue(generated as any);
      vi.mocked(templateRepo.save).mockRejectedValue(new Error('save failed'));
      const useCase = new GenerateTaskInstancesUseCase(templateRepo, instanceRepo);

      const result = await useCase.execute(template.id, template.identityId, {
        fromDate: 10,
        toDate: 20,
      });

      expect(result).toBeErrorWithCode('INTERNAL_ERROR');
    });
  });
});
