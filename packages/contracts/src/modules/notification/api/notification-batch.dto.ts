/**
 * Notification Batch Operations
 * 
 * This file contains DTOs for batch operations on notifications.
 * Includes marking multiple notifications as read, deleting in bulk, and cleanup operations.
 */

import { z } from 'zod';
import type { BatchOperationResultDTO } from '../dtos';
import { NotificationCategory } from '../value-objects';

// ============================================================================
// BATCH Operations
// ============================================================================

export const MarkAsReadBatchSchema = z.object({
  notificationUuids: z.array(z.string().uuid()).min(1),
});

export type MarkAsReadBatchReq = z.infer<typeof MarkAsReadBatchSchema>;
export type MarkAsReadBatchRes = BatchOperationResultDTO;

export const DeleteNotificationsBatchSchema = z.object({
  notificationUuids: z.array(z.string().uuid()).min(1),
});

export type DeleteNotificationsBatchReq = z.infer<typeof DeleteNotificationsBatchSchema>;
export type DeleteNotificationsBatchRes = BatchOperationResultDTO;

export const CleanupOldNotificationsSchema = z.object({
  accountUuid: z.string().uuid(),
  beforeDays: z.number().int().min(1),
  category: z.nativeEnum(NotificationCategory).optional(),
});

export type CleanupOldNotificationsReq = z.infer<typeof CleanupOldNotificationsSchema>;
export type CleanupOldNotificationsRes = BatchOperationResultDTO;
