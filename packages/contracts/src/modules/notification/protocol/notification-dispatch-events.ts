import type { NotificationCategory, NotificationType } from '../value-objects';
import type { ImportanceLevel, UrgencyLevel } from '../../../shared';

export interface NotificationDispatchBase {
  id: string;
  identityId: string;
  title: string;
  body?: string | null;
  category: NotificationCategory;
  type: NotificationType;
  urgency?: UrgencyLevel;
  importance?: ImportanceLevel;
  data?: Record<string, unknown>;
  sound?: {
    enabled: boolean;
    name?: string | null;
  } | null;
}

export interface NotificationDispatchDesktopEvent extends NotificationDispatchBase {
  icon?: string | null;
  silent?: boolean;
}

export interface NotificationDispatchInAppEvent extends NotificationDispatchBase {
  durationMs?: number | null;
}
