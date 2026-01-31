/**
 * SettingGroup Entity - Client Interface
 * 设置分组实体 - 客户端接口
 */

import type { SettingItemClient, SettingItemClientDTO } from './SettingItemClient';
import type { SettingGroupServerDTO } from './SettingGroupServer';

// ============ DTO 定义 ============

/**
 * SettingGroup Client DTO
 */
export interface SettingGroupClientDTO {
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parentGroupUuid?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings?: SettingItemClientDTO[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  isDeleted: boolean;
  settingCount: number;
  displayName: string;
}

// ============ 实体接口 ============

export interface SettingGroupClient {
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parentGroupUuid?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings?: SettingItemClient[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  isDeleted: boolean;
  settingCount: number;
  displayName: string;

  // UI 方法
  getDisplayName(): string;
  getIcon(): string;
  getBreadcrumbs(): string[];
  canEdit(): boolean;
  canDelete(): boolean;
  toggle(): void;}
