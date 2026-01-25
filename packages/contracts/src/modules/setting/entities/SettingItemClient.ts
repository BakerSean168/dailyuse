/**
 * SettingItem Entity - Client Interface
 * 设置项实体 - 客户端接口
 */

import type { UIConfigClient, UIConfigClientDTO } from '../value-objects/UIConfigClient';
import type { SettingItemServerDTO } from './SettingItemServer';

// ============ DTO 定义 ============

/**
 * SettingItem Client DTO
 */
export interface SettingItemClientDTO {
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: any;
  defaultValue: any;
  valueType: string;
  ui: UIConfigClientDTO;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
  displayValue: string;
  canEdit: boolean;
}

// ============ 实体接口 ============

export interface SettingItemClient {
  uuid: string;
  groupUuid: string;
  key: string;
  name: string;
  description?: string | null;
  value: any;
  defaultValue: any;
  valueType: string;
  ui: UIConfigClient;
  sortOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  displayValue: string;

  // UI 方法
  getDisplayValue(): string;
  getInputComponent(): string;
  canEdit(): boolean;
  canReset(): boolean;

  toServerDTO(): SettingItemServerDTO;
}

export interface SettingItemClientStatic {
  create(params: {
    groupUuid: string;
    key: string;
    name: string;
    description?: string;
    value: any;
    defaultValue: any;
    valueType: string;
    ui: UIConfigClient;
    sortOrder?: number;
    isReadOnly?: boolean;
    isVisible?: boolean;
  }): SettingItemClient;
  fromServerDTO(dto: SettingItemServerDTO): SettingItemClient;
  fromClientDTO(dto: SettingItemClientDTO): SettingItemClient;
}
