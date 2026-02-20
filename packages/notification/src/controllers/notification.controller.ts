/**
 * Notification Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import {
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationQuerySchema,
  MarkAsReadBatchSchema,
  DeleteNotificationsBatchSchema,
  CleanupOldNotificationsSchema,
} from '@dailyuse/contracts/notification';
import type {
  CreateNotificationReq,
  UpdateNotificationReq,
  NotificationQuery,
  MarkAsReadBatchReq,
  DeleteNotificationsBatchReq,
  CleanupOldNotificationsReq,
} from '@dailyuse/contracts/notification';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface NotificationUseCases {
  createNotification(data: CreateNotificationReq): Promise<Result<unknown>>;
  listNotifications(query: NotificationQuery): Promise<Result<unknown>>;
  getNotification(id: string): Promise<Result<unknown>>;
  updateNotification(id: string, data: UpdateNotificationReq): Promise<Result<unknown>>;
  deleteNotification(id: string): Promise<Result<unknown>>;
  markAsRead(id: string): Promise<Result<unknown>>;
  batchMarkAsRead(data: MarkAsReadBatchReq): Promise<Result<unknown>>;
  batchDelete(data: DeleteNotificationsBatchReq): Promise<Result<unknown>>;
  cleanupOldNotifications(data: CleanupOldNotificationsReq): Promise<Result<unknown>>;
}

export class NotificationController {
  constructor(private readonly useCases: NotificationUseCases) {}

  // ==================== CRUD Operations ====================

  async create(input: CreateNotificationReq): Promise<Result<unknown>> {
    const parsed = CreateNotificationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createNotification(parsed.data);
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
    return this.useCases.listNotifications(parsed.data);
  }

  async get(id: string): Promise<Result<unknown>> {
    return this.useCases.getNotification(id);
  }

  async update(id: string, input: UpdateNotificationReq): Promise<Result<unknown>> {
    const parsed = UpdateNotificationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateNotification(id, parsed.data);
  }

  async delete(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteNotification(id);
  }

  // ==================== Read/Batch Operations ====================

  async markAsRead(id: string): Promise<Result<unknown>> {
    return this.useCases.markAsRead(id);
  }

  async batchMarkAsRead(input: MarkAsReadBatchReq): Promise<Result<unknown>> {
    const parsed = MarkAsReadBatchSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.batchMarkAsRead(parsed.data);
  }

  async batchDelete(input: DeleteNotificationsBatchReq): Promise<Result<unknown>> {
    const parsed = DeleteNotificationsBatchSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.batchDelete(parsed.data);
  }

  async cleanup(input: CleanupOldNotificationsReq): Promise<Result<unknown>> {
    const parsed = CleanupOldNotificationsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.cleanupOldNotifications(parsed.data);
  }
}
