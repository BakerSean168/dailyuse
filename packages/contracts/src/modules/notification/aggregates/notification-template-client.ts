import type { NotificationCategory } from '../value-objects/notification-category';
import type { NotificationType } from '../value-objects/notification-type';
import type { NotificationTemplateConfigServerDTO } from '../value-objects/notification-template-config';
import type { NotificationTemplateId } from '../../../primitives';

export interface NotificationTemplateClientDTO {
  id: NotificationTemplateId;
  name: string;
  description: string | null;
  type: NotificationType;
  category: NotificationCategory;
  template: NotificationTemplateConfigServerDTO;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: number;
  updatedAt: number;
}
