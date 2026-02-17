/**
 * Notification Query Operations
 * 
 * This file contains DTOs for querying and listing notifications.
 * Supports filtering, pagination, and sorting of notification records.
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { IdentityId } from '@/primitives';
import type { NotificationListResultDTO } from '../dtos';
import {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
} from '../value-objects';

// ============================================================================
// QUERY Notifications
// ============================================================================

export const NotificationQuerySchema = z.object({
  identityId: brandedId<IdentityId>().optional(),
  type: z.nativeEnum(NotificationType).optional(),
  category: z.nativeEnum(NotificationCategory).optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
  isRead: z.boolean().optional(),
  relatedEntityType: z.nativeEnum(RelatedEntityType).optional(),
  relatedEntityId: z.string().uuid().optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  keyword: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'sentAt', 'importance', 'urgency']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
export type NotificationListRes = NotificationListResultDTO;
