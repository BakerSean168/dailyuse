/**
 * Notification Query Operations
 *
 * This file contains DTOs for querying and listing notifications.
 * Supports filtering, pagination, and sorting of notification records.
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { NotificationListResultDTO } from '../dtos/notification-result.dto';
import { NotificationType } from '../value-objects/notification-type';
import { NotificationCategory } from '../value-objects/notification-category';
import { NotificationStatus } from '../value-objects/notification-status';
import { RelatedEntityType } from '../value-objects/related-entity-type';

// ============================================================================
// QUERY Notifications
// ============================================================================

export const NotificationQuerySchema = z.object({
  type: z.enum(NotificationType).optional(),
  category: z.enum(NotificationCategory).optional(),
  status: z.enum(NotificationStatus).optional(),
  isRead: z.boolean().optional(),
  relatedEntityType: z.enum(RelatedEntityType).optional(),
  relatedEntityId: brandedId<string>().optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  keyword: z.string().optional(),
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'sentAt', 'importance', 'urgency'])
    .default('createdAt')
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
export type NotificationListRes = NotificationListResultDTO;
