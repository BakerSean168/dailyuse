/**
 * Setting Aggregate Root - Client Interface
 * 设置聚合根 - 客户端接口
 */

import type {
  ValidationRuleClient,
  ValidationRuleClientDTO,
} from '../value-objects/ValidationRuleClient';
import type { UIConfigClient, UIConfigClientDTO } from '../value-objects/UIConfigClient';
import type { SyncConfigClient, SyncConfigClientDTO } from '../value-objects/SyncConfigClient';
import type { SettingServerDTO } from './SettingServer';

// ============ DTO 定义 ============

/**
 * Setting Client DTO
 */
export interface SettingClientDTO {
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  valueType: string;
  value: any;
  defaultValue: any;
  scope: string;
  accountUuid?: string | null;
  deviceId?: string | null;
  groupUuid?: string | null;
  validation?: ValidationRuleClientDTO | null;
  ui?: UIConfigClientDTO | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig?: SyncConfigClientDTO | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  isDeleted: boolean;
  isDefault: boolean;
  hasChanged: boolean;
  displayName: string;
  displayValue: string;
}

// ============ 聚合根接口 ============

export interface SettingClient {
  uuid: string;
  key: string;
  name: string;
  description?: string | null;
  valueType: string;
  value: any;
  defaultValue: any;
  scope: string;
  accountUuid?: string | null;
  deviceId?: string | null;
  groupUuid?: string | null;
  validation?: ValidationRuleClient | null;
  ui?: UIConfigClient | null;
  isEncrypted: boolean;
  isReadOnly: boolean;
  isSystemSetting: boolean;
  syncConfig?: SyncConfigClient | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  isDeleted: boolean;
  isDefault: boolean;
  hasChanged: boolean;
  displayName: string;
  displayValue: string;

  // UI 方法
  getDisplayName(): string;
  getDisplayValue(): string;
  getInputComponent(): string;
  getValidationText(): string;
  canEdit(): boolean;
  canReset(): boolean;
  canSync(): boolean;
  validate(value: any): { valid: boolean; error?: string };
  setValue(value: any): void;
  reset(): void;

  toServerDTO(): SettingServerDTO;
}

export interface SettingClientStatic {
  create(params: {
    key: string;
    name: string;
    description?: string;
    valueType: string;
    value: any;
    defaultValue: any;
    scope: string;
    accountUuid?: string;
    deviceId?: string;
    groupUuid?: string;
    validation?: ValidationRuleClient;
    ui?: UIConfigClient;
    isEncrypted?: boolean;
    isReadOnly?: boolean;
    isSystemSetting?: boolean;
    syncConfig?: SyncConfigClient;
  }): SettingClient;
  fromServerDTO(dto: SettingServerDTO): SettingClient;
  fromClientDTO(dto: SettingClientDTO): SettingClient;
}
