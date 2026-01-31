/**
 * SettingGroup Entity - Server Interface
 * 设置分组实体 - 服务端接口
 */
import type { SettingGroupClientDTO } from './SettingGroupClient';
import type { SettingItemServer, SettingItemServerDTO } from './SettingItemServer';

// ============ DTO 定义 ============

/**
 * SettingGroup Server DTO
 */
export interface SettingGroupServerDTO {
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parentGroupUuid?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings?: SettingItemServerDTO[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

/**
 * SettingGroup Persistence DTO
 */
export interface SettingGroupPersistenceDTO {
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parentGroupUuid?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings: string; // JSON
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// ============ 实体接口 ============

export interface SettingGroupServer {
  uuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  parentGroupUuid?: string | null;
  path: string;
  level: number;
  sortOrder: number;
  settings?: SettingItemServer[] | null;
  isSystemGroup: boolean;
  isCollapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 业务方法
  addSetting(setting: SettingItemServer): void;
  removeSetting(settingUuid: string): void;
  reorderSettings(settingUuids: string[]): void;
  getSettings(): SettingItemServer[];
  getSettingByKey(key: string): SettingItemServer | null;
  collapse(): void;
  expand(): void;
  softDelete(): void;
  restore(): void;}
