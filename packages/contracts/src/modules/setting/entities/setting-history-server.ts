/**
 * SettingHistory Entity - Server Interface
 * 设置历史实体 - 服务端接�?
 */

import type { SettingId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { SettingHistoryClientDTO } from './setting-history-client';
// ============ DTO 定义 ============

/**
 * SettingHistory Server DTO
 */
export interface SettingHistoryServerDTO {
  id: string;
  settingId: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorId: string | null;
  operatorType: 'USER' | 'SYSTEM' | 'API';
  createdAt: TransferDate;
}

/**
 * SettingHistory Persistence DTO
 */
export interface SettingHistoryPersistenceDTO {
  id: string;
  settingId: string;
  settingKey: string;
  oldValue: string; // JSON
  newValue: string; // JSON
  operatorId: string | null;
  operatorType: 'USER' | 'SYSTEM' | 'API';
  createdAt: PersistenceDate;
}

// ============ 实体接口 ============

export interface SettingHistoryServer {
  id: SettingId;
  settingId: SettingId;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorId: IdentityId | null;
  operatorType: 'USER' | 'SYSTEM' | 'API';
  createdAt: DomainDate;
}
}
