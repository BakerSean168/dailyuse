/**
 * SettingHistory Entity - Client Interface
 * 设置历史实体 - 客户端接口
 */

import type { SettingHistoryServerDTO } from './SettingHistoryServer';

// ============ DTO 定义 ============

/**
 * SettingHistory Client DTO
 */
export interface SettingHistoryClientDTO {
  uuid: string;
  settingUuid: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorUuid?: string | null;
  operatorType: string;
  operatorName?: string | null;
  createdAt: number;
  timeAgo: string;
  changeText: string;
}

// ============ 实体接口 ============

export interface SettingHistoryClient {
  uuid: string;
  settingUuid: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  operatorUuid?: string | null;
  operatorType: string;
  operatorName?: string | null;
  createdAt: Date;
  timeAgo: string;
  changeText: string;

  // UI 方法
  getChangeText(): string;
  getOperatorText(): string;
  getIcon(): string;
  getTimeAgo(): string;

  toServerDTO(): SettingHistoryServerDTO;
}

export interface SettingHistoryClientStatic {
  create(params: {
    settingUuid: string;
    settingKey: string;
    oldValue: any;
    newValue: any;
    operatorUuid?: string;
    operatorType: string;
    operatorName?: string;
  }): SettingHistoryClient;
  fromServerDTO(dto: SettingHistoryServerDTO): SettingHistoryClient;
  fromClientDTO(dto: SettingHistoryClientDTO): SettingHistoryClient;
}
