/**
 * SettingItem Entity - Server Interface
 * 设置项实体 - 服务端接口
 */

import type { SettingItemClientDTO } from './SettingItemClient';
import type { UIConfigServer, UIConfigServerDTO } from '../value-objects/UIConfigServer';
import { SettingValueType } from '../enums';

// ============ DTO 定义 ============

/**
 * SettingItem Server DTO
 */
export interface SettingItemServerDTO {
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: any;
  defaultValue: any;
  valueType: SettingValueType;
  ui: UIConfigServerDTO;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * SettingItem Persistence DTO
 */
export interface SettingItemPersistenceDTO {
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: string; // JSON
  defaultValue: string; // JSON
  valueType: SettingValueType;
  ui: string; // JSON
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 实体接口 ============

export interface SettingItemServer {
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: any;
  defaultValue: any;
  valueType: SettingValueType;
  ui: UIConfigServer;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;

  // 业务方法
  setValue(newValue: any): void;
  resetToDefault(): void;
  isDefault(): boolean;}
