/**
 * Setting Entry Entity - Client
 */

import type { SettingEntryId, DomainDate, TransferDate } from '@/primitives';
import type { SettingCategory } from '../value-objects';

export interface SettingEntryClientDTO {
  id: SettingEntryId;
  key: string;
  value: any;
  category: SettingCategory;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
