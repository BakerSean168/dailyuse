/**
 * Setting Aggregate Root - Server Interface
 * 设置聚合�?- 服务端接�?
 */

import type {
  SettingId,
  SettingGroupId,
  IdentityId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '@/primitives';
import type { SettingClientDTO } from './setting-client';
import type {
  ValidationRuleServer,
  ValidationRuleServerDTO,
} from '../value-objects/validation-rule-server';
import type { UIConfigServer, UIConfigServerDTO } from '../value-objects/ui-config-server';
import type { SyncConfigServer, SyncConfigServerDTO } from '../value-objects/sync-config-server';
import type {
  SettingHistoryServer,
  SettingHistoryServerDTO,
} from '../entities/setting-history-server';
import { SettingValueType } from '../value-objects/setting-value-type';

// ============ DTO 定义 ============

/**
 * Setting Server DTO
 */
export interface SettingServerDTO {
  id: string;
  key: string;
  name: string;
  description: string | null;
  valueType: SettingValueType;
  value: any;
  defaultValue: any;
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  identityId: string | null;
  deviceId: string | null;
  groupId: string | null;
  validation: ValidationRuleServerDTO | null;
  ui: UIConfigServerDTO | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig: SyncConfigServerDTO | null;
  history: SettingHistoryServerDTO[] | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * Setting Persistence DTO
 */
export interface SettingPersistenceDTO {
  id: string;
  key: string;
  name: string;
  description: string | null;
  valueType: SettingValueType;
  value: string; // JSON
  defaultValue: string; // JSON
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  identityId: string | null;
  deviceId: string | null;
  groupId: string | null;
  validation: string | null; // JSON
  ui: string | null; // JSON
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig: string | null; // JSON
  history: string; // JSON
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}

// ============ 聚合根接�?============

export interface SettingServer {
  id: SettingId;
  key: string;
  name: string;
  description: string | null;
  valueType: SettingValueType;
  value: any;
  defaultValue: any;
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  identityId: IdentityId | null;
  deviceId: string | null;
  groupId: SettingGroupId | null;
  validation: ValidationRuleServer | null;
  ui: UIConfigServer | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig: SyncConfigServer | null;
  history: SettingHistoryServer[] | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;

  // DTO 转换方法
  toServerDTO(includeHistory?: boolean): SettingServerDTO;

  /**
   * 转换�?Client DTO
   * @param includeChildren 是否包含子实体（默认 false�?
   */
  toClientDTO(includeChildren?: boolean): SettingClientDTO;
}
}
