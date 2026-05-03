/**
 * TaskDependency Controller
 *
 * Encapsulates Zod validation and use case orchestration for task dependencies.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import type { TaskDependencyServerDTO, DependencyType } from '@dailyuse/contracts/task';
import type { DependencyChainServerDTO } from '@dailyuse/contracts/task';
import { formatZodErrors } from '@dailyuse/utils/result';
import { z } from 'zod';
import type { CreateTaskDependencyUseCase } from '../application-server/use-cases/commands/create-task-dependency.use-case';
import type { DeleteTaskDependencyUseCase } from '../application-server/use-cases/commands/delete-task-dependency.use-case';
import type { UpdateTaskDependencyUseCase } from '../application-server/use-cases/commands/update-task-dependency.use-case';
import type { ListTaskDependenciesUseCase } from '../application-server/use-cases/queries/list-task-dependencies.use-case';
import type { GetDependencyChainUseCase } from '../application-server/use-cases/queries/get-dependency-chain.use-case';
import type { ValidateTaskDependencyUseCase } from '../application-server/use-cases/queries/validate-task-dependency.use-case';
import type { ValidateDependencyResult } from '../application-server/use-cases/queries/validate-task-dependency.use-case';

const CreateDependencySchema = z.object({
  predecessorTaskId: z.string().min(1),
  successorTaskId: z.string().min(1),
  dependencyType: z.string().optional(),
  lagDays: z.number().optional(),
});

const UpdateDependencySchema = z.object({
  dependencyType: z.string().optional(),
  lagDays: z.number().optional(),
});

const ValidateDependencySchema = z.object({
  predecessorTaskId: z.string().min(1),
  successorTaskId: z.string().min(1),
});

export interface TaskDependencyUseCases {
  createDependency: CreateTaskDependencyUseCase;
  deleteDependency: DeleteTaskDependencyUseCase;
  updateDependency: UpdateTaskDependencyUseCase;
  listDependencies: ListTaskDependenciesUseCase;
  getDependencyChain: GetDependencyChainUseCase;
  validateDependency: ValidateTaskDependencyUseCase;
}

export class TaskDependencyController {
  constructor(private readonly useCases: TaskDependencyUseCases) {}

  /**
   * Create a new dependency
   */
  async createDependency(
    taskId: string,
    input: unknown,
    identityId: string,
  ): Promise<Result<TaskDependencyServerDTO>> {
    const parsed = CreateDependencySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.createDependency.execute({
      predecessorTaskId: parsed.data.predecessorTaskId,
      successorTaskId: taskId,
      dependencyType: parsed.data.dependencyType as DependencyType | undefined,
      lagDays: parsed.data.lagDays,
      identityId,
    });
  }

  /**
   * Get dependencies for a task (predecessor tasks)
   */
  async getDependencies(taskId: string): Promise<Result<TaskDependencyServerDTO[]>> {
    return await this.useCases.listDependencies.executeDependencies(taskId);
  }

  /**
   * Get dependents for a task (successor tasks)
   */
  async getDependents(taskId: string): Promise<Result<TaskDependencyServerDTO[]>> {
    return await this.useCases.listDependencies.executeDependents(taskId);
  }

  /**
   * Get dependency chain for a task
   */
  async getDependencyChain(taskId: string): Promise<Result<DependencyChainServerDTO>> {
    return await this.useCases.getDependencyChain.execute(taskId);
  }

  /**
   * Validate a potential dependency
   */
  async validateDependency(input: unknown): Promise<Result<ValidateDependencyResult>> {
    const parsed = ValidateDependencySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.validateDependency.execute(
      parsed.data.predecessorTaskId,
      parsed.data.successorTaskId,
    );
  }

  /**
   * Delete a dependency
   */
  async deleteDependency(id: string): Promise<Result<void>> {
    return await this.useCases.deleteDependency.execute(id);
  }

  /**
   * Update a dependency
   */
  async updateDependency(id: string, input: unknown): Promise<Result<TaskDependencyServerDTO>> {
    const parsed = UpdateDependencySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.updateDependency.execute(id, {
      dependencyType: parsed.data.dependencyType as DependencyType | undefined,
      lagDays: parsed.data.lagDays,
    });
  }
}
