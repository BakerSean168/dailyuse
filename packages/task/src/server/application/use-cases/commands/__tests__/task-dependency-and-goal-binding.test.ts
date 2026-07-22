import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { IdentityId } from '@dailyuse/domain-shared';
import type { ITaskDependencyRepository } from '@/server/domain/repositories/i-task-dependency-repository';
import type { ITaskTemplateRepository } from '@/server/domain/repositories/i-task-template-repository';
import { TaskDependency } from '@/server/domain/aggregates/task-dependency';
import { CreateTaskDependencyUseCase } from '../create-task-dependency.use-case';
import { DeleteTaskDependencyUseCase } from '../delete-task-dependency.use-case';
import { UpdateTaskDependencyUseCase } from '../update-task-dependency.use-case';
import { BindTaskToGoalUseCase } from '../bind-task-to-goal.use-case';
import { UnbindTaskFromGoalUseCase } from '../unbind-task-from-goal.use-case';

describe('Task dependency and goal binding use-cases', () => {
  let dependencyRepo: ReturnType<typeof createMockRepo<ITaskDependencyRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;

  beforeEach(() => {
    vi.clearAllMocks();
    dependencyRepo = createMockRepo<ITaskDependencyRepository>({
      findByPredecessorAndSuccessorId: vi.fn(),
      create: vi.fn(),
      findByIdForIdentity: vi.fn(),
      findAggregateById: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteAggregate: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
    });
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
  });

  describe('CreateTaskDependencyUseCase', () => {
    it('returns validation error for self-dependency', async () => {
      const useCase = new CreateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute({
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-1',
        identityId: 'identity-1',
      });

      expect((result as any).ok).toBe(false);
      expect((result as any).error.code).toBe('VALIDATION_ERROR');
      expect(dependencyRepo.findByPredecessorAndSuccessorId).not.toHaveBeenCalled();
      expect(dependencyRepo.create).not.toHaveBeenCalled();
    });

    it('returns duplicate error when relation already exists', async () => {
      vi.mocked(dependencyRepo.findByPredecessorAndSuccessorId).mockResolvedValue({
        id: 'dep-1',
      } as any);
      const useCase = new CreateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute({
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        identityId: 'identity-1',
      });

      expect((result as any).ok).toBe(false);
      expect((result as any).error.code).toBe('DUPLICATE');
      expect(dependencyRepo.create).not.toHaveBeenCalled();
    });

    it('creates dependency and returns ok result', async () => {
      vi.mocked(dependencyRepo.findByPredecessorAndSuccessorId).mockResolvedValue(null);
      vi.mocked(dependencyRepo.create).mockResolvedValue({
        id: 'dep-1',
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        dependencyType: 'FS',
        lagDays: 0,
      } as any);
      const useCase = new CreateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute({
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        dependencyType: 'FS',
        lagDays: 0,
        identityId: 'identity-1',
      });

      expect(result).toBeOk();
      expect(dependencyRepo.create).toHaveBeenCalledWith({
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        dependencyType: 'FS',
        lagDays: 0,
        identityId: 'identity-1',
      });
    });
  });

  describe('DeleteTaskDependencyUseCase', () => {
    it('returns NOT_FOUND when dependency is missing', async () => {
      vi.mocked(dependencyRepo.findAggregateById).mockResolvedValue(null);
      const useCase = new DeleteTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute('dep-404', 'identity-1');

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(dependencyRepo.deleteAggregate).not.toHaveBeenCalled();
    });

    it('deletes dependency through deleteAggregate and returns ok', async () => {
      const dependency = TaskDependency.create({
        identityId: IdentityId.generate(),
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
      });
      dependency.pullDomainEvents();
      vi.mocked(dependencyRepo.findAggregateById).mockResolvedValue(dependency);
      const useCase = new DeleteTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute('dep-1', 'identity-1');

      expect(result).toBeOk();
      expect(dependencyRepo.deleteAggregate).toHaveBeenCalledWith(dependency);
      expect(dependency.domainEvents).toHaveLength(1);
      expect(dependency.domainEvents[0]?.eventType).toBe('task:dependency-deleted');
    });
  });

  describe('UpdateTaskDependencyUseCase', () => {
    it('returns NOT_FOUND when dependency is missing', async () => {
      vi.mocked(dependencyRepo.findByIdForIdentity).mockResolvedValue(null);
      const useCase = new UpdateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute('dep-404', 'identity-1', { dependencyType: 'FS' as any });

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(dependencyRepo.update).not.toHaveBeenCalled();
    });

    it('updates dependency and returns DTO', async () => {
      vi.mocked(dependencyRepo.findByIdForIdentity).mockResolvedValue({ id: 'dep-1' } as any);
      vi.mocked(dependencyRepo.update).mockResolvedValue({
        id: 'dep-1',
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        dependencyType: 'SS',
        lagDays: 2,
      } as any);
      const useCase = new UpdateTaskDependencyUseCase(dependencyRepo);

      const result = await useCase.execute('dep-1', 'identity-1', { dependencyType: 'SS' as any, lagDays: 2 });

      expect(result).toBeOkWith({
        id: 'dep-1',
        dependencyType: 'SS',
        lagDays: 2,
      });
      expect(dependencyRepo.update).toHaveBeenCalledWith('identity-1', 'dep-1', {
        dependencyType: 'SS',
        lagDays: 2,
      });
    });
  });

  describe('BindTaskToGoalUseCase', () => {
    it('returns NOT_FOUND when template is missing', async () => {
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(null);
      const useCase = new BindTaskToGoalUseCase(templateRepo);

      const result = await useCase.execute('tpl-404', 'identity-1', {
        goalId: 'goal-1',
        keyResultId: 'kr-1',
        goalRecordValue: 5,
      } as any);

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(templateRepo.save).not.toHaveBeenCalled();
    });

    it('binds template to goal and persists', async () => {
      const template = {
        bindToGoal: vi.fn(),
        toClientDTO: vi.fn().mockReturnValue({ id: 'tpl-1' }),
      };
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template as any);
      const useCase = new BindTaskToGoalUseCase(templateRepo);

      const result = await useCase.execute('tpl-1', 'identity-1', {
        goalId: 'goal-1',
        keyResultId: 'kr-1',
        goalRecordValue: 9,
      } as any);

      expect(result).toBeOkWith({ id: 'tpl-1' });
      expect(template.bindToGoal).toHaveBeenCalledWith('goal-1', 'kr-1', 9);
      expect(templateRepo.save).toHaveBeenCalledWith(template);
    });
  });

  describe('UnbindTaskFromGoalUseCase', () => {
    it('returns NOT_FOUND when template is missing', async () => {
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(null);
      const useCase = new UnbindTaskFromGoalUseCase(templateRepo);

      const result = await useCase.execute('tpl-404', 'identity-1');

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(templateRepo.save).not.toHaveBeenCalled();
    });

    it('unbinds template and persists', async () => {
      const template = {
        unlinkFromGoal: vi.fn(),
        toClientDTO: vi.fn().mockReturnValue({ id: 'tpl-1' }),
      };
      vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template as any);
      const useCase = new UnbindTaskFromGoalUseCase(templateRepo);

      const result = await useCase.execute('tpl-1', 'identity-1');

      expect(result).toBeOkWith({ id: 'tpl-1' });
      expect(template.unlinkFromGoal).toHaveBeenCalledTimes(1);
      expect(templateRepo.save).toHaveBeenCalledWith(template);
    });
  });
});
