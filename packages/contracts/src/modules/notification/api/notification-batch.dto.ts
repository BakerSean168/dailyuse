/**
 * Notification Batch Operations
 * 
 * This file contains DTOs for batch operations on notifications.
 * Includes marking multiple notifications as read, deleting in bulk, and cleanup operations.
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { NotificationId, IdentityId } from '../../../primitives';
import type { BatchOperationResultDTO } from '../dtos';
import { NotificationCategory } from '../value-objects';

// ============================================================================
// BATCH Operations
// ============================================================================

export const MarkAsReadBatchSchema = z.object({
  notificationIds: z.array(brandedId<NotificationId>()).min(1),
});

export type MarkAsReadBatchReq = z.infer<typeof MarkAsReadBatchSchema>;
export type MarkAsReadBatchRes = BatchOperationResultDTO;

export const DeleteNotificationsBatchSchema = z.object({
  notificationIds: z.array(brandedId<NotificationId>()).min(1),
});

export type DeleteNotificationsBatchReq = z.infer<typeof DeleteNotificationsBatchSchema>;
export type DeleteNotificationsBatchRes = BatchOperationResultDTO;

export const CleanupOldNotificationsSchema = z.object({
  identityId: brandedId<IdentityId>(),
  beforeDays: z.number().int().min(1),
  category: z.enum(NotificationCategory).optional(),
});

export type CleanupOldNotificationsReq = z.infer<typeof CleanupOldNotificationsSchema>;
export type CleanupOldNotificationsRes = BatchOperationResultDTO;
