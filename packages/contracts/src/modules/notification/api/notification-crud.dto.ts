/**
 * Notification CRUD Operations
 *
 * This file contains DTOs for creating and updating notifications.
 * Handles the basic lifecycle operations for notification records.
 */

import { z } from 'zod';
import { brandedId, openApiJsonValue } from '../../../primitives';
import type { NotificationServerDTO } from '../aggregates/notification-server';
import { NotificationType } from '../value-objects/notification-type';
import { NotificationCategory } from '../value-objects/notification-category';
import { NotificationStatus } from '../value-objects/notification-status';
import { RelatedEntityType } from '../value-objects/related-entity-type';
import { NotificationChannelType } from '../value-objects/notification-channel-type';

// ============================================================================
// CREATE Notification
// ============================================================================

export const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(NotificationType),
  category: z.enum(NotificationCategory),
  importance: z.string().optional(),
  urgency: z.string().optional(),
  relatedEntityType: z.enum(RelatedEntityType).optional(),
  relatedEntityId: brandedId<string>().optional(),
  actions: z.array(z.any().openapi({ type: 'object' })).optional(),
  metadata: z.record(z.string(), openApiJsonValue).optional(),
  expiresAt: z.number().int().optional(),
  sendImmediately: z.boolean().default(false).optional(),
  channels: z.array(z.enum(NotificationChannelType)).optional(),
});

export type CreateNotificationReq = z.infer<typeof CreateNotificationSchema>;
export type CreateNotificationRes = NotificationServerDTO;

// ============================================================================
// UPDATE Notification
// ============================================================================

export const UpdateNotificationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(NotificationStatus).optional(),
  metadata: z.record(z.string(), openApiJsonValue).optional(),
  expiresAt: z.number().int().optional(),
});

export type UpdateNotificationReq = z.infer<typeof UpdateNotificationSchema>;
export type UpdateNotificationRes = NotificationServerDTO;
