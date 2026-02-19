/**
 * Schedule Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Each method:
 * 1. Validates input via Zod schema (where applicable)
 * 2. Delegates to the corresponding handler
 * 3. Returns a Result<T> (transport-agnostic)
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import {
  CreateScheduleTaskRequestSchema,
  UpdateScheduleTaskRequestSchema,
  ScheduleTaskQueryParamsSchema,
  BatchScheduleTaskOperationRequestSchema,
} from '@dailyuse/contracts/schedule';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { ScheduleRouteHandlers } from './routes';

/**
 * Schedule Controller
 *
 * Provides validated handler calls for the Schedule module.
 * Used by both expressAdapter (HTTP) and ipcAdapter (IPC).
 */
export class ScheduleController {
  constructor(private readonly handlers: ScheduleRouteHandlers) {}

  // ==================== Task CRUD ====================

  async createTask(input: unknown, identityId: string): Promise<Result<unknown>> {
    const parsed = CreateScheduleTaskRequestSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.createTask({
      name: parsed.data.name,
      sourceModule: parsed.data.sourceModule,
      sourceId: parsed.data.sourceEntityId,
      scheduleConfig: parsed.data.schedule,
      handlerType: parsed.data.sourceModule,
      description: parsed.data.description,
      retryPolicy: parsed.data.retryPolicy,
      enabled: parsed.data.enabled,
      identityId,
    });
    return ok(data);
  }

  async listTasks(identityId: string, query: Record<string, unknown>): Promise<Result<unknown>> {
    const parsed = ScheduleTaskQueryParamsSchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    let result: any;
    if (parsed.data.status) {
      result = await this.handlers.listTasksByStatus(parsed.data.status);
    } else if (parsed.data.sourceModule && parsed.data.sourceEntityId) {
      result = await this.handlers.listTasksBySource(parsed.data.sourceModule, parsed.data.sourceEntityId);
    } else {
      result = await this.handlers.listTasksByAccount(identityId);
    }
    return ok(result);
  }

  async getTask(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.getTask(id);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Schedule task not found' });
    }
    return ok(data);
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
    const data = await this.handlers.updateTask({
      id,
      scheduleConfig: parsed.data.schedule,
      retryPolicy: parsed.data.retryPolicy,
      enabled: parsed.data.enabled,
      description: parsed.data.description,
    });
    return ok(data);
  }

  async deleteTask(id: string): Promise<Result<unknown>> {
    await this.handlers.deleteTask(id);
    return ok(null);
  }

  // ==================== Task Actions ====================

  async pauseTask(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.pauseTask(id);
    return ok(data);
  }

  async resumeTask(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.resumeTask(id);
    return ok(data);
  }

  async triggerTask(id: string): Promise<Result<unknown>> {
    await this.handlers.triggerTask(id);
    return ok(null);
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
            await this.handlers.pauseTask(taskId);
            break;
          case 'resume':
            await this.handlers.resumeTask(taskId);
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
