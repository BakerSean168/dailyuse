/**
 * SettingItem Entity - Server Interface
 * 设置项实�?- 服务端接�?
 */

import type {
  SettingId,
  SettingGroupId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '@/primitives';
import type { SettingItemClientDTO } from './setting-item-client';
import type { UIConfigServer, UIConfigServerDTO } from '../value-objects/ui-config';
import { SettingValueType } from '../value-objects/setting-value-type';

// ============ DTO 定义 ============

/**
 * SettingItem Server DTO
 */
export interface SettingItemServerDTO {
  id: string;
  groupId: string;
  key: string;
  name: string;
  description: string | null;
  value: any;
  defaultValue: any;
  valueType: SettingValueType;
  ui: UIConfigServerDTO;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * SettingItem Persistence DTO
 */
export interface SettingItemPersistenceDTO {
  id: string;
  groupId: string;
  key: string;
  name: string;
  description: string | null;
  value: string; // JSON
  defaultValue: string; // JSON
  valueType: SettingValueType;
  ui: string; // JSON
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 实体接口 ============

export interface SettingItemServer {
  id: SettingId;
  groupId: SettingGroupId;
  key: string;
  name: string;
  description: string | null;
  value: any;
  defaultValue: any;
  valueType: SettingValueType;
  ui: UIConfigServer;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}
