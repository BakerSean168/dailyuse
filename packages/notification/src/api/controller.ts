/**
 * Notification Controller
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
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationQuerySchema,
  MarkAsReadBatchSchema,
  DeleteNotificationsBatchSchema,
  CleanupOldNotificationsSchema,
} from '@dailyuse/contracts/notification';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { NotificationRouteHandlers } from './routes';

/**
 * Notification Controller
 *
 * Provides validated handler calls for the Notification module.
 * Used by both expressAdapter (HTTP) and ipcAdapter (IPC).
 */
export class NotificationController {
  constructor(private readonly handlers: NotificationRouteHandlers) {}

  // ==================== CRUD Operations ====================

  async create(input: unknown): Promise<Result<unknown>> {
    const parsed = CreateNotificationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.createNotification(parsed.data);
    return ok(data);
  }

  async list(query: Record<string, unknown>): Promise<Result<unknown>> {
    const parsed = NotificationQuerySchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.listNotifications(parsed.data);
    return ok(data);
  }

  async get(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.getNotification(id);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Notification not found' });
    }
    return ok(data);
  }

  async update(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateNotificationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.updateNotification(id, parsed.data);
    return ok(data);
  }

  async delete(id: string): Promise<Result<unknown>> {
    await this.handlers.deleteNotification(id);
    return ok(null);
  }

  // ==================== Read/Batch Operations ====================

  async markAsRead(id: string): Promise<Result<unknown>> {
    await this.handlers.markAsRead(id);
    return ok(null);
  }

  async batchMarkAsRead(input: unknown): Promise<Result<unknown>> {
    const parsed = MarkAsReadBatchSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.batchMarkAsRead(parsed.data);
    return ok(data);
  }

  async batchDelete(input: unknown): Promise<Result<unknown>> {
    const parsed = DeleteNotificationsBatchSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.batchDelete(parsed.data);
    return ok(data);
  }

  async cleanup(input: unknown): Promise<Result<unknown>> {
    const parsed = CleanupOldNotificationsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const data = await this.handlers.cleanupOldNotifications(parsed.data);
    return ok(data);
  }
}
