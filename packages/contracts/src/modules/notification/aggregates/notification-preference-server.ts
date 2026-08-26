import type {
  NotificationGlobalChannelPreferencesDTO,
  NotificationWorkflowOverridesDTO,
} from '../value-objects/notification-workflow';
import type { DoNotDisturbConfigDTO } from '../value-objects/do-not-disturb-config';
import type { RateLimitDTO } from '../value-objects/rate-limit';
import type { IdentityId, NotificationPreferenceId, TransferDate } from '../../../primitives';

/** User preference document; workflow capability/default remains workflow-owned. */
export interface NotificationPreferenceServerDTO {
  id: NotificationPreferenceId;
  identityId: IdentityId;
  globalChannels: NotificationGlobalChannelPreferencesDTO;
  workflowOverrides: NotificationWorkflowOverridesDTO;
  doNotDisturb?: DoNotDisturbConfigDTO | null;
  rateLimit?: RateLimitDTO | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
