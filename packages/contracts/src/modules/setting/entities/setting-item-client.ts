/**
 * SettingItem Entity - Client Interface
 * 设置项实�?- 客户端接�?
 */

import type { SettingId, SettingGroupId, TransferDate, DomainDate } from '@/primitives';
import type { UIConfigClient, UIConfigClientDTO } from '../value-objects/ui-config';
import type { SettingItemServerDTO } from './setting-item-server';

// ============ DTO 定义 ============

/**
 * SettingItem Client DTO
 */
export interface SettingItemClientDTO {
  id: string;
  groupId: string;
  key: string;
  name: string;
  description: string | null;
  value: any;
  defaultValue: any;
  valueType: string;
  ui: UIConfigClientDTO;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  isDefault: boolean;
  displayValue: string;
  canEdit: boolean;
}

// ============ 实体接口 ============

export interface SettingItemClient {
  id: SettingId;
  groupId: SettingGroupId;
  key: string;
  name: string;
  description: string | null;
  value: any;
  defaultValue: any;
  valueType: string;
  ui: UIConfigClient;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  isDefault: boolean;
  displayValue: string;
}
