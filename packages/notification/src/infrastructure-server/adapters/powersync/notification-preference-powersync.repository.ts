import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { NotificationPreference } from '../../../domain-server/aggregates/notification-preference';
import type { INotificationPreferenceRepository } from '../../../domain-server/repositories/INotificationPreferenceRepository';

export class PowerSyncNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(_preference: NotificationPreference): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findById(_id: string): Promise<NotificationPreference | null> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async findByIdentityId(_identityId: string): Promise<NotificationPreference | null> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async exists(_id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async existsForIdentity(_identityId: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/desktop');
  }

  async getOrCreate(_identityId: string): Promise<NotificationPreference> {
    throw new Error('Not implemented - extract from apps/desktop');
  }
}
