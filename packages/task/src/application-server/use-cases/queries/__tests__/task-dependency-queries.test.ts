import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { ok, error } from '@dailyuse/contracts/result';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import { GetDependencyChainUseCaseUseCase } from '../get-dependency-chain.use-case';
import { ListTaskDependenciesUseCaseUseCase } from '../list-task-dependencies.use-case';
import { ListTaskTemplatesByPriorityUseCaseUseCase } from '../list-task-templates-by-priority.use-case';
import { ValidateTaskDependencyUseCaseUseCase } from '../validate-task-dependency.use-case';
import { GetTaskTemplateGraphUseCaseUseCase } from '../get-task-template-graph.use-case';

describe('Task dependency query use-cases', () => {
  let dependencyRepo: ReturnType<typeof createMockRepo<ITaskDependencyRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;

  beforeEach(() => {
    vi.clearAllMocks();
    dependencyRepo = createMockRepo<ITaskDependencyRepository>({
      findAllPredecessorIds: vi.fn().mockResolvedValue([]),
      findAllSuccessorIds: vi.fn().mockResolvedValue([]),
      findBySuccessorId: vi.fn().mockResolvedValue([]),
      findByPredecessorId: vi.fn().mockResolvedValue([]),
      findByPredecessorAndSuccessorId: vi.fn().mockResolvedValue(null),
      findAllByIdentityId: vi.fn().mockResolvedValue([]),
    });
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findSortedByPriority: vi.fn().mockResolvedValue([]),
    });
  });

  describe('GetDependencyChainUseCase', () => {
    it('returns predecessor/successor chain summary', async () => {
      vi.mocked(dependencyRepo.findAllPredecessorIds).mockResolvedValue(['p1', 'p2']);
      vi.mocked(dependencyRepo.findAllSuccessorIds).mockResolvedValue(['s1']);
      const useCase = new GetDependencyChainUseCase(dependencyRepo);

      const result = await useCase.execute('task-1');

      expect(result).toBeOkWith({
        taskId: 'task-1',
        allPredecessors: ['p1', 'p2'],
        allSuccessors: ['s1'],
        depth: 2,
        isOnCriticalPath: false,
      });
    });
  });

  describe('ListTaskDependenciesUseCase', () => {
    it('lists dependencies by successor id', async () => {
      vi.mocked(dependencyRepo.findBySuccessorId).mockResolvedValue([{ id: 'dep-1' } as any]);
      const useCase = new ListTaskDependenciesUseCase(dependencyRepo);

      const result = await useCase.executeDependencies('task-1');

      expect(result).toBeOkWith([{ id: 'dep-1' }] as any);
      expect(dependencyRepo.findBySuccessorId).toHaveBeenCalledWith('task-1');
    });

    it('lists dependents by predecessor id', async () => {
      vi.mocked(dependencyRepo.findByPredecessorId).mockResolvedValue([{ id: 'dep-2' } as any]);
      const useCase = new ListTaskDependenciesUseCase(dependencyRepo);

      const result = await useCase.executeDependents('task-1');

      expect(result).toBeOkWith([{ id: 'dep-2' }] as any);
      expect(dependencyRepo.findByPredecessorId).toHaveBeenCalledWith('task-1');
    });
  });

  describe('ListTaskTemplatesByPriorityUseCase', () => {
    it('maps sorted templates to client DTO', async () => {
      const t1 = { toClientDTO: vi.fn().mockReturnValue({ id: 'tpl-1' }) };
      const t2 = { toClientDTO: vi.fn().mockReturnValue({ id: 'tpl-2' }) };
      vi.mocked(templateRepo.findSortedByPriority).mockResolvedValue([t1, t2] as any);
      const useCase = new ListTaskTemplatesByPriorityUseCase(templateRepo);

      const result = await useCase.execute('identity-1', 5);

      expect(result).toBeOkWith([{ id: 'tpl-1' }, { id: 'tpl-2' }] as any);
      expect(templateRepo.findSortedByPriority).toHaveBeenCalledWith('identity-1', 5);
    });
  });

  describe('ValidateTaskDependencyUseCase', () => {
    it('rejects self dependency', async () => {
      const useCase = new ValidateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute('task-1', 'task-1');

      expect(result).toBeOkWith({
        isValid: false,
        wouldCreateCycle: true,
      });
      expect(dependencyRepo.findByPredecessorAndSuccessorId).not.toHaveBeenCalled();
    });

    it('rejects duplicate dependency', async () => {
      vi.mocked(dependencyRepo.findByPredecessorAndSuccessorId).mockResolvedValue({
        id: 'dep-1',
      } as any);
      const useCase = new ValidateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute('task-1', 'task-2');

      expect(result).toBeOkWith({
        isValid: false,
        message: '依赖关系已存在',
      });
      expect(dependencyRepo.findAllSuccessorIds).not.toHaveBeenCalled();
    });

    it('rejects cycle-producing dependency', async () => {
      vi.mocked(dependencyRepo.findByPredecessorAndSuccessorId).mockResolvedValue(null);
      vi.mocked(dependencyRepo.findAllSuccessorIds).mockResolvedValue(['task-1', 'task-9']);
      const useCase = new ValidateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute('task-1', 'task-2');

      expect(result).toBeOkWith({
        isValid: false,
        wouldCreateCycle: true,
      });
      if (result.ok) {
        expect(result.data.cyclePath).toEqual(['task-1', 'task-2', 'task-1', 'task-9']);
      }
    });

    it('returns valid result when checks pass', async () => {
      vi.mocked(dependencyRepo.findByPredecessorAndSuccessorId).mockResolvedValue(null);
      vi.mocked(dependencyRepo.findAllSuccessorIds).mockResolvedValue(['task-5']);
      const useCase = new ValidateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute('task-1', 'task-2');

      expect(result).toBeOkWith({
        isValid: true,
        message: '依赖关系验证通过',
      });
    });
  });

  describe('GetTaskTemplateGraphUseCase', () => {
    it('returns filtered dependencies for listed templates', async () => {
      const listTaskTemplates = {
        execute: vi.fn().mockResolvedValue(
          ok({
            templates: [{ id: 't1' }, { id: 't2' }] as any,
            total: 2,
          }),
        ),
      } as any;
      vi.mocked(dependencyRepo.findAllByIdentityId).mockResolvedValue([
        {
          id: 'd1',
          predecessorTaskId: 't1',
          successorTaskId: 't2',
          dependencyType: 'FS',
          lagDays: 0,
          createdAt: 1,
          updatedAt: 2,
        },
        {
          id: 'd2',
          predecessorTaskId: 'x',
          successorTaskId: 'y',
          dependencyType: 'FS',
          lagDays: 0,
          createdAt: 1,
          updatedAt: 2,
        },
      ] as any);
      const useCase = new GetTaskTemplateGraphUseCase(listTaskTemplates, dependencyRepo);

      const result = await useCase.execute({ identityId: 'identity-1' } as any);

      expect(result).toBeOk();
      if (result.ok) {
        expect(result.data.total).toBe(2);
        expect(result.data.dependencies).toHaveLength(1);
        expect(result.data.dependencies[0].id).toBe('d1');
      }
      expect(dependencyRepo.findAllByIdentityId).toHaveBeenCalledWith('identity-1');
    });

    it('propagates template listing failure', async () => {
      const failed = error('NOT_FOUND', 'no templates');
      const listTaskTemplates = {
        execute: vi.fn().mockResolvedValue(failed),
      } as any;
      const useCase = new GetTaskTemplateGraphUseCase(listTaskTemplates, dependencyRepo);

      const result = await useCase.execute({ identityId: 'identity-1' } as any);

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(dependencyRepo.findAllByIdentityId).not.toHaveBeenCalled();
    });
  });
});