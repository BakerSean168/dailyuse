/**
 * SettingHistory Entity - Server Interface
 * 设置历史实体 - 服务端接口
 */

import type { SettingHistoryClientDTO } from './SettingHistoryClient';
// ============ DTO 定义 ============

/**
 * SettingHistory Server DTO
 */
export interface SettingHistoryServerDTO {
  uuid: string;
  settingUuid: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorUuid?: string | null;
  operatorType: 'USER' | 'SYSTEM' | 'API';
  createdAt: number;
}

/**
 * SettingHistory Persistence DTO
 */
export interface SettingHistoryPersistenceDTO {
  uuid: string;
  settingUuid: string;
  settingKey: string;
  oldValue: string; // JSON
  newValue: string; // JSON
  operatorUuid?: string | null;
  operatorType: 'USER' | 'SYSTEM' | 'API';
  createdAt: Date;
}

// ============ 实体接口 ============

export interface SettingHistoryServer {
  uuid: string;
  settingUuid: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorUuid?: string | null;
  operatorType: 'USER' | 'SYSTEM' | 'API';
  createdAt: Date;}
