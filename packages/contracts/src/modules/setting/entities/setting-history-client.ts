/**
 * SettingHistory Entity - Client Interface
 * 设置历史实体 - 客户端接�?
 */

import type { SettingId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { SettingHistoryServerDTO } from './setting-history-server';

// ============ DTO 定义 ============

/**
 * SettingHistory Client DTO
 */
export interface SettingHistoryClientDTO {
  id: string;
  settingId: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorId: string | null;
  operatorType: string;
  operatorName: string | null;
  createdAt: TransferDate;
  timeAgo: string;
  changeText: string;
}

// ============ 实体接口 ============

export interface SettingHistoryClient {
  id: SettingId;
  settingId: SettingId;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorId: IdentityId | null;
  operatorType: string;
  operatorName: string | null;
  createdAt: DomainDate;
  timeAgo: string;
  changeText: string;

  // UI 方法
  getChangeText(): string;
  getOperatorText(): string;
  getIcon(): string;
  getTimeAgo(): string;
}
}
