/**
 * TaskDependency Controller
 *
 * Encapsulates Zod validation and use case orchestration for task dependencies.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail, isOk, ok } from '@dailyuse/contracts/result';
import type { TaskDependencyClientDTO, DependencyType } from '@dailyuse/contracts/task';
import type { DependencyChainClientDTO } from '@dailyuse/contracts/task';
import {
  CreateDependencyBodySchema,
  UpdateDependencyBodySchema,
  ValidateDependencyBodySchema,
  type ValidateDependencyResponse,
} from '@dailyuse/contracts/task';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { CreateTaskDependencyUseCase } from '../application/use-cases/commands/create-task-dependency.use-case';
import type { DeleteTaskDependencyUseCase } from '../application/use-cases/commands/delete-task-dependency.use-case';
import type { UpdateTaskDependencyUseCase } from '../application/use-cases/commands/update-task-dependency.use-case';
import type { ListTaskDependenciesUseCase } from '../application/use-cases/queries/list-task-dependencies.use-case';
import type { GetDependencyChainUseCase } from '../application/use-cases/queries/get-dependency-chain.use-case';
import type { ValidateTaskDependencyUseCase } from '../application/use-cases/queries/validate-task-dependency.use-case';

type TaskControllerFn<T extends (...args: never[]) => unknown> = (
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
  async getDependencies(
    taskId: string,
    identityId: string,
  ): Promise<Result<TaskDependencyClientDTO[]>> {
    return await this.useCases.getDependencies(taskId, identityId);
  }

  /**
   * Get dependents for a task (successor tasks)
   */
  async getDependents(
    taskId: string,
    identityId: string,
  ): Promise<Result<TaskDependencyClientDTO[]>> {
    return await this.useCases.getDependents(taskId, identityId);
  }

  /**
   * Get dependency chain for a task
   */
  async getDependencyChain(
    taskId: string,
    identityId: string,
  ): Promise<Result<DependencyChainClientDTO>> {
    return await this.useCases.getDependencyChain(taskId, identityId);
  }

  /**
   * Validate a potential dependency
   */
  async validateDependency(
    input: unknown,
    identityId: string,
  ): Promise<Result<ValidateDependencyResponse>> {
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
      identityId,
    );
  }

  /**
   * Delete a dependency
   */
  async deleteDependency(id: string, identityId: string): Promise<Result<null>> {
    const result = await this.useCases.deleteDependency(id, identityId);
    if (!isOk(result)) {
      return result as Result<null>;
    }
    // Serialize as data:null (no Result.void / undefined dual-track).
    return ok(null);
  }

  /**
   * Update a dependency
   */
  async updateDependency(
    id: string,
    input: unknown,
    identityId: string,
  ): Promise<Result<TaskDependencyClientDTO>> {
    const parsed = UpdateDependencyBodySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.updateDependency(id, identityId, {
      dependencyType: parsed.data.dependencyType as DependencyType | undefined,
      lagDays: parsed.data.lagDays,
    });
  }
}
