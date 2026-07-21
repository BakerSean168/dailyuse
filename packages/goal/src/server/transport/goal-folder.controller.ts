/**
 * Goal Folder Controller
 *
 * Encapsulates Zod validation and use case orchestration for goal folders.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import {
  CreateGoalFolderSchema,
  UpdateGoalFolderSchema,
  ListGoalFolderFiltersSchema,
} from '@dailyuse/contracts/goal';
import type { ListGoalFoldersQuery } from '@dailyuse/contracts/goal';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { formatZodErrors } from '@dailyuse/utils/result';
import type {
  CreateGoalFolderUseCase,
  GetGoalFolderUseCase,
  ListGoalFoldersUseCase,
  UpdateGoalFolderUseCase,
  DeleteGoalFolderUseCase,
} from '../application';

// ============ Use Case Port ============

export interface GoalFolderUseCases {
  createGoalFolder: CreateGoalFolderUseCase['execute'];
  getGoalFolder: GetGoalFolderUseCase['execute'];
  listGoalFolders: ListGoalFoldersUseCase['execute'];
  updateGoalFolder: UpdateGoalFolderUseCase['execute'];
  deleteGoalFolder: DeleteGoalFolderUseCase['execute'];
}

/**
 * Goal Folder Controller
 *
 * Provides validated use-case calls for the Goal Folder entity.
 */
export class GoalFolderController {
  constructor(private readonly useCases: GoalFolderUseCases) {}

  // ==================== Folder CRUD ====================

  async create(input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = CreateGoalFolderSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createGoalFolder(
      cx.identityId as unknown as IdentityId,
      parsed.data,
    );
  }

  async list(filters: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = ListGoalFolderFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    // Construct internal query with identityId from context
    const query: ListGoalFoldersQuery = {
      ...parsed.data,
      identityId: cx.identityId as unknown as IdentityId,
    };
    return this.useCases.listGoalFolders(query);
  }

  async get(id: string): Promise<Result<unknown>> {
    return this.useCases.getGoalFolder(id);
  }

  async update(id: string, input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = UpdateGoalFolderSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateGoalFolder(id, cx.identityId, parsed.data);
  }

  async delete(id: string, cx: ExecutionContext): Promise<Result<null>> {
    const result = await this.useCases.deleteGoalFolder(id, cx.identityId);
    if (!result.ok) return result;
    return ok(null);
  }
}
