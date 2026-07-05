/**
 * TaskDependency Controller
 *
 * Encapsulates Zod validation and use case orchestration for task dependencies.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { TaskDependencyClientDTO, DependencyType } from '@dailyuse/contracts/task';
import type { DependencyChainClientDTO } from '@dailyuse/contracts/task';
import {
  CreateDependencyBodySchema,
  UpdateDependencyBodySchema,
  ValidateDependencyBodySchema,
  type ValidateDependencyResponse,
} from '@dailyuse/contracts/task';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { CreateTaskDependencyUseCase } from '../application-server/use-cases/commands/create-task-dependency.use-case';
import type { DeleteTaskDependencyUseCase } from '../application-server/use-cases/commands/delete-task-dependency.use-case';
import type { UpdateTaskDependencyUseCase } from '../application-server/use-cases/commands/update-task-dependency.use-case';
import type { ListTaskDependenciesUseCase } from '../application-server/use-cases/queries/list-task-dependencies.use-case';
import type { GetDependencyChainUseCase } from '../application-server/use-cases/queries/get-dependency-chain.use-case';
import type { ValidateTaskDependencyUseCase } from '../application-server/use-cases/queries/validate-task-dependency.use-case';

type TaskControllerFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export interface TaskDependencyUseCases {
  createDependency: TaskControllerFn<CreateTaskDependencyUseCase['execute']>;
  deleteDependency: TaskControllerFn<DeleteTaskDependencyUseCase['execute']>;
  updateDependency: TaskControllerFn<UpdateTaskDependencyUseCase['execute']>;
  getDependencies: TaskControllerFn<ListTaskDependenciesUseCase['executeDependencies']>;
  getDependents: TaskControllerFn<ListTaskDependenciesUseCase['executeDependents']>;
  getDependencyChain: TaskControllerFn<GetDependencyChainUseCase['execute']>;
  validateDependency: TaskControllerFn<ValidateTaskDependencyUseCase['execute']>;
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
  ): Promise<Result<TaskDependencyClientDTO>> {
    const parsed = CreateDependencyBodySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.createDependency({
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
  async getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return await this.useCases.getDependencies(taskId);
  }

  /**
   * Get dependents for a task (successor tasks)
   */
  async getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return await this.useCases.getDependents(taskId);
  }

  /**
   * Get dependency chain for a task
   */
  async getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>> {
    return await this.useCases.getDependencyChain(taskId);
  }

  /**
   * Validate a potential dependency
   */
  async validateDependency(input: unknown): Promise<Result<ValidateDependencyResponse>> {
    const parsed = ValidateDependencyBodySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.validateDependency(
      parsed.data.predecessorTaskId,
      parsed.data.successorTaskId,
    );
  }

  /**
   * Delete a dependency
   */
  async deleteDependency(id: string): Promise<Result<void>> {
    return await this.useCases.deleteDependency(id);
  }

  /**
   * Update a dependency
   */
  async updateDependency(id: string, input: unknown): Promise<Result<TaskDependencyClientDTO>> {
    const parsed = UpdateDependencyBodySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.updateDependency(id, {
      dependencyType: parsed.data.dependencyType as DependencyType | undefined,
      lagDays: parsed.data.lagDays,
    });
  }
}
