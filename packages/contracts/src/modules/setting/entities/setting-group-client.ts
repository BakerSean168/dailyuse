/**
 * SettingGroup Entity - Client Interface
 * 设置分组实体 - 客户端接�?
 */

import type { SettingGroupId, TransferDate, DomainDate } from '@/primitives';
import type { SettingItemClient, SettingItemClientDTO } from './setting-item-client';
import type { SettingGroupServerDTO } from './setting-group-server';

// ============ DTO 定义 ============

/**
 * SettingGroup Client DTO
 */
export interface SettingGroupClientDTO {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: SettingItemClientDTO[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  isDeleted: boolean;
  settingCount: number;
  displayName: string;
}

// ============ 实体接口 ============

export interface SettingGroupClient {
  id: SettingGroupId;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: SettingGroupId | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: SettingItemClient[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
  isDeleted: boolean;
  settingCount: number;
  displayName: string;

  // DTO 转换方法
}
}
