import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import { CreateTaskDependency } from '../create-task-dependency';
import { DeleteTaskDependency } from '../delete-task-dependency';
import { UpdateTaskDependency } from '../update-task-dependency';
import { BindTaskToGoal } from '../bind-task-to-goal';
import { UnbindTaskFromGoal } from '../unbind-task-from-goal';

describe('Task dependency and goal binding use-cases', () => {
  let dependencyRepo: ReturnType<typeof createMockRepo<ITaskDependencyRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;

  beforeEach(() => {
    vi.clearAllMocks();
    dependencyRepo = createMockRepo<ITaskDependencyRepository>({
      findByPredecessorAndSuccessorId: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
    });
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
  });

  describe('CreateTaskDependency', () => {
    it('returns validation error for self-dependency', async () => {
      const useCase = new CreateTaskDependency(dependencyRepo);

      const result = await useCase.execute({
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-1',
        identityId: 'identity-1',
      });

      expect((result as any).success).toBe(false);
      expect((result as any).error.code).toBe('VALIDATION_ERROR');
      expect(dependencyRepo.findByPredecessorAndSuccessorId).not.toHaveBeenCalled();
      expect(dependencyRepo.create).not.toHaveBeenCalled();
    });

    it('returns duplicate error when relation already exists', async () => {
      vi.mocked(dependencyRepo.findByPredecessorAndSuccessorId).mockResolvedValue({
        id: 'dep-1',
      } as any);
      const useCase = new CreateTaskDependency(dependencyRepo);

      const result = await useCase.execute({
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        identityId: 'identity-1',
      });

      expect((result as any).success).toBe(false);
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
      const useCase = new CreateTaskDependency(dependencyRepo);

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

  describe('DeleteTaskDependency', () => {
    it('returns NOT_FOUND when dependency is missing', async () => {
      vi.mocked(dependencyRepo.findById).mockResolvedValue(null);
      const useCase = new DeleteTaskDependency(dependencyRepo);

      const result = await useCase.execute('dep-404');

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(dependencyRepo.delete).not.toHaveBeenCalled();
    });

    it('deletes dependency and returns ok', async () => {
      vi.mocked(dependencyRepo.findById).mockResolvedValue({ id: 'dep-1' } as any);
      const useCase = new DeleteTaskDependency(dependencyRepo);

      const result = await useCase.execute('dep-1');

      expect(result).toBeOk();
      expect(dependencyRepo.delete).toHaveBeenCalledWith('dep-1');
    });
  });

  describe('UpdateTaskDependency', () => {
    it('returns NOT_FOUND when dependency is missing', async () => {
      vi.mocked(dependencyRepo.findById).mockResolvedValue(null);
      const useCase = new UpdateTaskDependency(dependencyRepo);

      const result = await useCase.execute('dep-404', { dependencyType: 'FS' as any });

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(dependencyRepo.update).not.toHaveBeenCalled();
    });

    it('updates dependency and returns DTO', async () => {
      vi.mocked(dependencyRepo.findById).mockResolvedValue({ id: 'dep-1' } as any);
      vi.mocked(dependencyRepo.update).mockResolvedValue({
        id: 'dep-1',
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        dependencyType: 'SS',
        lagDays: 2,
      } as any);
      const useCase = new UpdateTaskDependency(dependencyRepo);

      const result = await useCase.execute('dep-1', { dependencyType: 'SS' as any, lagDays: 2 });

      expect(result).toBeOkWith({
        id: 'dep-1',
        dependencyType: 'SS',
        lagDays: 2,
      });
      expect(dependencyRepo.update).toHaveBeenCalledWith('dep-1', {
        dependencyType: 'SS',
        lagDays: 2,
      });
    });
  });

  describe('BindTaskToGoal', () => {
    it('returns NOT_FOUND when template is missing', async () => {
      vi.mocked(templateRepo.findById).mockResolvedValue(null);
      const useCase = new BindTaskToGoal(templateRepo);

      const result = await useCase.execute('tpl-404', {
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
      vi.mocked(templateRepo.findById).mockResolvedValue(template as any);
      const useCase = new BindTaskToGoal(templateRepo);

      const result = await useCase.execute('tpl-1', {
        goalId: 'goal-1',
        keyResultId: 'kr-1',
        goalRecordValue: 9,
      } as any);

      expect(result).toBeOkWith({ id: 'tpl-1' });
      expect(template.bindToGoal).toHaveBeenCalledWith('goal-1', 'kr-1', 9);
      expect(templateRepo.save).toHaveBeenCalledWith(template);
    });
  });

  describe('UnbindTaskFromGoal', () => {
    it('returns NOT_FOUND when template is missing', async () => {
      vi.mocked(templateRepo.findById).mockResolvedValue(null);
      const useCase = new UnbindTaskFromGoal(templateRepo);

      const result = await useCase.execute('tpl-404');

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(templateRepo.save).not.toHaveBeenCalled();
    });

    it('unbinds template and persists', async () => {
      const template = {
        unlinkFromGoal: vi.fn(),
        toClientDTO: vi.fn().mockReturnValue({ id: 'tpl-1' }),
      };
      vi.mocked(templateRepo.findById).mockResolvedValue(template as any);
      const useCase = new UnbindTaskFromGoal(templateRepo);

      const result = await useCase.execute('tpl-1');

      expect(result).toBeOkWith({ id: 'tpl-1' });
      expect(template.unlinkFromGoal).toHaveBeenCalledTimes(1);
      expect(templateRepo.save).toHaveBeenCalledWith(template);
    });
  });
});