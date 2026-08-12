/**
 * Schedule Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@memoflow/contracts/result';
import { fail, ok } from '@memoflow/contracts/result';
import type { Context } from '@memoflow/contracts/shared';
import type { ScheduleApplicationPort } from '../application';
import {
  CreateScheduleTaskRequestSchema,
  UpdateScheduleTaskRequestSchema,
  ScheduleTaskQueryParamsSchema,
  BatchScheduleTaskOperationRequestSchema,
  UpdateTaskMetadataRequestSchema,
} from '@memoflow/contracts/schedule';
import type {
  CreateScheduleTaskRequest,
  UpdateScheduleTaskRequest,
} from '@memoflow/contracts/schedule';
import { formatZodErrors } from '@memoflow/utils/result';

export class ScheduleController {
  constructor(private readonly api: ScheduleApplicationPort) {}

  // ==================== Task CRUD ====================

  async createTask(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateScheduleTaskRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.createTask(parsed.data as unknown as CreateScheduleTaskRequest, ctx);
  }

  async listTasks(query: Record<string, unknown>, ctx: Context): Promise<Result<unknown>> {
    const parsed = ScheduleTaskQueryParamsSchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.listTasks(parsed.data, ctx);
  }

  async getTask(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.api.getTask(id, ctx);
  }

  async updateTask(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateScheduleTaskRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.updateTask(id, parsed.data as unknown as UpdateScheduleTaskRequest, ctx);
  }

  async deleteTask(id: string, ctx: Context): Promise<Result<null>> {
    const result = await this.api.deleteTask(id, ctx);
    if (!result.ok) return result as Result<null>;
    // Serialize as data:null (no Result.void / undefined dual-track).
    return ok(null);
  }

  // ==================== Task Actions ====================

  async pauseTask(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.api.pauseTask(id, ctx);
  }

  async resumeTask(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.api.resumeTask(id, ctx);
  }

  async triggerTask(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.api.triggerTask(id, ctx);
  }

  async completeTask(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.api.completeTask(id, ctx);
  }

  async cancelTask(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const reason =
      typeof input === 'object' && input !== null && 'reason' in input
        ? String((input as { reason: unknown }).reason)
        : 'User cancelled';
    return this.api.cancelTask(id, reason, ctx);
  }

  async getDueTasks(ctx: Context): Promise<Result<unknown>> {
    return this.api.getDueTasks(ctx);
  }

  async batchDeleteTasks(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const ids =
      typeof input === 'object' && input !== null && 'taskIds' in input
        ? (input as { taskIds: unknown }).taskIds
        : undefined;
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail({ code: 'VALIDATION_ERROR', message: 'taskIds must be a non-empty array' });
    }
    return this.api.batchDeleteTasks(ids, ctx);
  }

  async updateTaskMetadata(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateTaskMetadataRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.api.updateTaskMetadata(id, parsed.data, ctx);
  }

  // ==================== Batch Operations ====================

  async batchOperation(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = BatchScheduleTaskOperationRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.api.batchOperateTasks(parsed.data, ctx);
  }

  // ==================== W7 Operation Timeline / Replay / Audit ====================

  async queryRebuildTimeline(ctx: Context): Promise<Result<unknown>> {
    return this.api.queryRebuildTimeline(ctx);
  }

  async replayRebuildOutbox(operationId: string, ctx: Context): Promise<Result<unknown>> {
    return this.api.replayRebuildOutbox(operationId, ctx);
  }

  async getOperationAudit(ctx: Context): Promise<Result<unknown>> {
    return this.api.getOperationAudit(ctx);
  }
}
