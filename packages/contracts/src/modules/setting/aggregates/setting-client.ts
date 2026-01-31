/**
 * Setting Aggregate Root - Client Interface
 * 设置聚合�?- 客户端接�?
 */

import type { SettingId, SettingGroupId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type {
  ValidationRuleClient,
  ValidationRuleClientDTO,
} from '../value-objects/validation-rule-client';
import type { UIConfigClient, UIConfigClientDTO } from '../value-objects/ui-config-client';
import type { SyncConfigClient, SyncConfigClientDTO } from '../value-objects/sync-config-client';
import type { SettingServerDTO } from './setting-server';

// ============ DTO 定义 ============

/**
 * Setting Client DTO
 */
export interface SettingClientDTO {
  id: string;
  key: string;
  name: string;
  description: string | null;
  valueType: string;
  value: any;
  defaultValue: any;
  scope: string;
  identityId: string | null;
  deviceId: string | null;
  groupId: string | null;
  validation: ValidationRuleClientDTO | null;
  ui: UIConfigClientDTO | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig: SyncConfigClientDTO | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  isDeleted: boolean;
  isDefault: boolean;
  hasChanged: boolean;
  displayName: string;
  displayValue: string;
}

// ============ 聚合根接�?============

export interface SettingClient {
  id: SettingId;
  key: string;
  name: string;
  description: string | null;
  valueType: string;
  value: any;
  defaultValue: any;
  scope: string;
  identityId: IdentityId | null;
  deviceId: string | null;
  groupId: SettingGroupId | null;
  validation: ValidationRuleClient | null;
  ui: UIConfigClient | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig: SyncConfigClient | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
  isDeleted: boolean;
  isDefault: boolean;
  hasChanged: boolean;
  displayName: string;
  displayValue: string;

  // DTO 转换方法
}
}
