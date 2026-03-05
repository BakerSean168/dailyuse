/**
 * Goal Folder Controller
 *
 * Encapsulates Zod validation and use case orchestration for goal folders.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import {
  CreateGoalFolderSchema,
  UpdateGoalFolderSchema,
  QueryGoalFoldersSchema,
} from '@dailyuse/contracts/goal';
import type { Context } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { formatZodErrors } from '@dailyuse/utils/result';
import type {
  CreateGoalFolder,
  GetGoalFolder,
  ListGoalFolders,
  UpdateGoalFolder,
  DeleteGoalFolder,
} from '../application-server';

// ============ Use Case Port ============

export interface GoalFolderUseCases {
  createGoalFolder: CreateGoalFolder;
  getGoalFolder: GetGoalFolder;
  listGoalFolders: ListGoalFolders;
  updateGoalFolder: UpdateGoalFolder;
  deleteGoalFolder: DeleteGoalFolder;
}

/**
 * Goal Folder Controller
 *
 * Provides validated use-case calls for the Goal Folder entity.
 */
export class GoalFolderController {
  constructor(private readonly useCases: GoalFolderUseCases) {}

  // ==================== Folder CRUD ====================

  async create(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateGoalFolderSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const folder = await this.useCases.createGoalFolder.execute(
      ctx.identityId as unknown as IdentityId,
      parsed.data,
    );
    return ok(folder);
  }

  async list(query: unknown): Promise<Result<unknown>> {
    const parsed = QueryGoalFoldersSchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const result = await this.useCases.listGoalFolders.execute(parsed.data);
    return ok(result);
  }

  async get(id: string): Promise<Result<unknown>> {
    const folder = await this.useCases.getGoalFolder.execute(id);
    if (!folder) {
      return fail({ code: 'NOT_FOUND', message: '文件夹不存在' });
    }
    return ok(folder);
  }

  async update(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateGoalFolderSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const folder = await this.useCases.updateGoalFolder.execute(id, ctx.identityId, parsed.data);
    return ok(folder);
  }

  async delete(id: string, ctx: Context): Promise<Result<unknown>> {
    await this.useCases.deleteGoalFolder.execute(id, ctx.identityId);
    return ok(null);
  }
}
