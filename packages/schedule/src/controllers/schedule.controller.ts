/**
 * Schedule Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  CreateScheduleTaskRequestSchema,
  UpdateScheduleTaskRequestSchema,
  ScheduleTaskQueryParamsSchema,
  BatchScheduleTaskOperationRequestSchema,
} from '@dailyuse/contracts/schedule';
import type {
  CreateScheduleTaskRequest,
  UpdateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface ScheduleUseCases {
  createTask(data: CreateScheduleTaskRequest, ctx: Context): Promise<Result<unknown>>;
  listTasks(query: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
  getTask(id: string): Promise<Result<unknown>>;
  updateTask(id: string, data: UpdateScheduleTaskRequest): Promise<Result<unknown>>;
  deleteTask(id: string): Promise<Result<unknown>>;
  pauseTask(id: string): Promise<Result<unknown>>;
  resumeTask(id: string): Promise<Result<unknown>>;
  triggerTask(id: string): Promise<Result<unknown>>;
  completeTask(id: string): Promise<Result<unknown>>;
  cancelTask(id: string, reason: string): Promise<Result<unknown>>;
  getDueTasks(ctx: Context): Promise<Result<unknown>>;
  batchDeleteTasks(ids: string[]): Promise<Result<unknown>>;
  updateTaskMetadata(id: string, metadata: Record<string, unknown>): Promise<Result<unknown>>;
}

export class ScheduleController {
  constructor(private readonly useCases: ScheduleUseCases) {}

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
    return this.useCases.createTask(parsed.data as unknown as CreateScheduleTaskRequest, ctx);
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
    return this.useCases.listTasks(parsed.data, ctx);
  }

  async getTask(id: string): Promise<Result<unknown>> {
    return this.useCases.getTask(id);
  }

  async updateTask(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateScheduleTaskRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateTask(id, parsed.data as unknown as UpdateScheduleTaskRequest);
  }

  async deleteTask(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteTask(id);
  }

  // ==================== Task Actions ====================

  async pauseTask(id: string): Promise<Result<unknown>> {
    return this.useCases.pauseTask(id);
  }

  async resumeTask(id: string): Promise<Result<unknown>> {
    return this.useCases.resumeTask(id);
  }

  async triggerTask(id: string): Promise<Result<unknown>> {
    return this.useCases.triggerTask(id);
  }

  async completeTask(id: string): Promise<Result<unknown>> {
    return this.useCases.completeTask(id);
  }

  async cancelTask(id: string, input: unknown): Promise<Result<unknown>> {
    const reason = (input as any)?.reason ?? 'User cancelled';
    return this.useCases.cancelTask(id, reason);
  }

  async getDueTasks(ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getDueTasks(ctx);
  }

  async batchDeleteTasks(input: unknown): Promise<Result<unknown>> {
    const ids = (input as any)?.taskIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail({ code: 'VALIDATION_ERROR', message: 'taskIds must be a non-empty array' });
    }
    return this.useCases.batchDeleteTasks(ids);
  }

  async updateTaskMetadata(id: string, input: unknown): Promise<Result<unknown>> {
    if (!input || typeof input !== 'object') {
      return fail({ code: 'VALIDATION_ERROR', message: 'metadata must be an object' });
    }
    return this.useCases.updateTaskMetadata(id, input as Record<string, unknown>);
  }

  // ==================== Batch Operations ====================

  async batchOperation(input: unknown): Promise<Result<unknown>> {
    const parsed = BatchScheduleTaskOperationRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const { taskIds, operation } = parsed.data;
    const results = { success: [] as string[], failed: [] as { taskId: string; error: string }[] };

    for (const taskId of taskIds) {
      try {
        switch (operation) {
          case 'pause':
            await this.useCases.pauseTask(taskId);
            break;
          case 'resume':
            await this.useCases.resumeTask(taskId);
            break;
          default:
            throw new Error(`Unsupported batch operation: ${operation}`);
        }
        results.success.push(taskId);
      } catch (err) {
        results.failed.push({
          taskId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return ok({
      ...results,
      total: taskIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
    });
  }
}
