/**
 * Setting Aggregate Root - Server Interface
 * 设置聚合根 - 服务端接口
 */

import type { SettingClientDTO } from './SettingClient';
import type {
  ValidationRuleServer,
  ValidationRuleServerDTO,
} from '../value-objects/ValidationRuleServer';
import type { UIConfigServer, UIConfigServerDTO } from '../value-objects/UIConfigServer';
import type { SyncConfigServer, SyncConfigServerDTO } from '../value-objects/SyncConfigServer';
import type {
  SettingHistoryServer,
  SettingHistoryServerDTO,
} from '../entities/SettingHistoryServer';
import { SettingValueType } from '../enums';

// ============ DTO 定义 ============

/**
 * Setting Server DTO
 */
export interface SettingServerDTO {
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  valueType: SettingValueType;
  value: any;
  defaultValue: any;
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  accountUuid?: string | null;
  deviceId?: string | null;
  groupUuid?: string | null;
  validation?: ValidationRuleServerDTO | null;
  ui?: UIConfigServerDTO | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig?: SyncConfigServerDTO | null;
  history?: SettingHistoryServerDTO[] | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

/**
 * Setting Persistence DTO
 */
export interface SettingPersistenceDTO {
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  valueType: SettingValueType;
  value: string; // JSON
  defaultValue: string; // JSON
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  accountUuid?: string | null;
  deviceId?: string | null;
  groupUuid?: string | null;
  validation?: string | null; // JSON
  ui?: string | null; // JSON
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig?: string | null; // JSON
  history: string; // JSON
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// ============ 聚合根接口 ============

export interface SettingServer {
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  valueType: SettingValueType;
  value: any;
  defaultValue: any;
  scope: 'SYSTEM' | 'USER' | 'DEVICE';
  accountUuid?: string | null;
  deviceId?: string | null;
  groupUuid?: string | null;
  validation?: ValidationRuleServer | null;
  ui?: UIConfigServer | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig?: SyncConfigServer | null;
  history?: SettingHistoryServer[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 值管理
  setValue(newValue: any, operatorUuid?: string): void;
  resetToDefault(): void;
  getValue(): any;
  getTypedValue<T>(): T;

  // 验证
  validate(value: any): { valid: boolean; error?: string };

  // 加密
  encrypt(): void;
  decrypt(): any;

  // 同步
  sync(): Promise<void>;

  // 历史记录
  addHistory(oldValue: any, newValue: any, operatorUuid?: string): void;
  getHistory(limit?: number): SettingHistoryServer[];

  // 查询
  isDefault(): boolean;
  hasChanged(): boolean;

  toServerDTO(includeHistory?: boolean): SettingServerDTO;

  /**
   * 转换为 Client DTO
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toClientDTO(includeChildren?: boolean): SettingClientDTO;}
