/**
 * Notification CRUD Operations
 * 
 * This file contains DTOs for creating and updating notifications.
 * Handles the basic lifecycle operations for notification records.
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { IdentityId } from '@/primitives';
import type { NotificationServerDTO } from '../aggregates/notification-server';
import {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
} from '../value-objects';

// ============================================================================
// CREATE Notification
// ============================================================================

export const CreateNotificationSchema = z.object({
  identityId: brandedId<IdentityId>(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.nativeEnum(NotificationType),
  category: z.nativeEnum(NotificationCategory),
  importance: z.string().optional(),
  urgency: z.string().optional(),
  relatedEntityType: z.nativeEnum(RelatedEntityType).optional(),
  relatedEntityId: z.string().uuid().optional(),
  actions: z.array(z.any()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.number().int().optional(),
  sendImmediately: z.boolean().optional().default(false),
  channels: z.array(z.nativeEnum(NotificationChannelType)).optional(),
});

export type CreateNotificationReq = z.infer<typeof CreateNotificationSchema>;
export type CreateNotificationRes = NotificationServerDTO;

// ============================================================================
// UPDATE Notification
// ============================================================================

export const UpdateNotificationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.number().int().optional(),
});

export type UpdateNotificationReq = z.infer<typeof UpdateNotificationSchema>;
export type UpdateNotificationRes = NotificationServerDTO;
