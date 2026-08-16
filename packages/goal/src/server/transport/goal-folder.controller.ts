/**
 * Goal Folder Controller
 *
 * Encapsulates Zod validation and use case orchestration for goal folders.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@memoflow/contracts/result';
import { fail, ok } from '@memoflow/contracts/result';
import { ListGoalFolderFiltersSchema } from '@memoflow/contracts/goal';
import { formatZodErrors } from '@memoflow/utils/result';
import type {
  CreateGoalFolderReq,
  ListGoalFoldersQuery,
  UpdateGoalFolderReq,
} from '@memoflow/contracts/goal';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type {
  CreateGoalFolderUseCase,
  GetGoalFolderUseCase,
  ListGoalFoldersUseCase,
  UpdateGoalFolderUseCase,
  DeleteGoalFolderUseCase,
} from '../application';
import { toIdentityId } from './mappers';

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

  async create(input: CreateGoalFolderReq, cx: ExecutionContext): Promise<Result<unknown>> {
    return this.useCases.createGoalFolder(toIdentityId(cx.identityId), input);
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
      identityId: toIdentityId(cx.identityId),
    };
    return this.useCases.listGoalFolders(query);
  }

  async get(id: string, cx: ExecutionContext): Promise<Result<unknown>> {
    return this.useCases.getGoalFolder(id, cx.identityId);
  }

  async update(
    id: string,
    input: UpdateGoalFolderReq,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    return this.useCases.updateGoalFolder(id, cx.identityId, input);
  }

  async delete(id: string, cx: ExecutionContext): Promise<Result<null>> {
    const result = await this.useCases.deleteGoalFolder(id, cx.identityId);
    if (!result.ok) return result;
    return ok(null);
  }
}
