/**
 * NotificationTemplate Aggregate Root - Server Interface
 *
 * Soft residual 839: ClientDTO dual retired via NotificationTemplateResponseSchema + z.infer
 * (see notification-template-client-dto-dual surface). Server DTO remains interface
 * (same shape as Client; TransferDate timestamps).
 */

import type { NotificationCategory } from '../value-objects/notification-category';
import type { NotificationType } from '../value-objects/notification-type';
import type { NotificationTemplateConfigServerDTO } from '../value-objects/notification-template-config';
import type { NotificationTemplateId, TransferDate } from '../../../primitives';

export interface NotificationTemplateServerDTO {
  id: NotificationTemplateId;
  name: string;
  description: string | null;
  type: NotificationType;
  category: NotificationCategory;
  template: NotificationTemplateConfigServerDTO;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
