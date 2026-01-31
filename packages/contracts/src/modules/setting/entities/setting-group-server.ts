/**
 * SettingGroup Entity - Server Interface
 * 设置分组实体 - 服务端接�?
 */

import type {
  SettingGroupId,
  SettingId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '@/primitives';
import type { SettingGroupClientDTO } from './setting-group-client';
import type { SettingItemServer, SettingItemServerDTO } from './setting-item-server';

// ============ DTO 定义 ============

/**
 * SettingGroup Server DTO
 */
export interface SettingGroupServerDTO {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: SettingItemServerDTO[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * SettingGroup Persistence DTO
 */
export interface SettingGroupPersistenceDTO {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: string; // JSON
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}

// ============ 实体接口 ============

export interface SettingGroupServer {
  id: SettingGroupId;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: SettingGroupId | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: SettingItemServer[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}
