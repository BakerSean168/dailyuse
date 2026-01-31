/**
 * UserSetting Aggregate Root - Client Interface
 * 用户设置聚合�?- 客户端接�?
 */

import type { SettingId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { UserSettingServerDTO } from './user-setting-server';

// ============ DTO 定义 ============

/**
 * UserSetting Client DTO
 */
export interface UserSettingClientDTO {
  id: string;
  identityId: string;
  appearance: {
    theme: string;
    accentColor: string;
    fontSize: string;
    fontFamily: string | null;
    compactMode: boolean;
  };
  locale: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    weekStartsOn: number;
    currency: string;
  };
  workflow: {
    defaultTaskView: string;
    defaultGoalView: string;
    defaultScheduleView: string;
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  privacy: {
    profileVisibility: string;
    showOnlineStatus: boolean;
    allowSearchByEmail: boolean;
    allowSearchByPhone: boolean;
    shareUsageData: boolean;
  };
  experimental: {
    enabled: boolean;
    features: string[];
  };
  createdAt: TransferDate;
  updatedAt: TransferDate;
  themeText: string;
  languageText: string;
  experimentalFeatureCount: number;
}

// ============ 聚合根接�?============

export interface UserSettingClient {
  id: SettingId;
  identityId: IdentityId;
  appearance: {
    theme: string;
    accentColor: string;
    fontSize: string;
    fontFamily: string | null;
    compactMode: boolean;
  };
  locale: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    weekStartsOn: number;
    currency: string;
  };
  workflow: {
    defaultTaskView: string;
    defaultGoalView: string;
    defaultScheduleView: string;
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  privacy: {
    profileVisibility: string;
    showOnlineStatus: boolean;
    allowSearchByEmail: boolean;
    allowSearchByPhone: boolean;
    shareUsageData: boolean;
  };
  experimental: {
    enabled: boolean;
    features: string[];
  };
  createdAt: DomainDate;
  updatedAt: DomainDate;
  themeText: string;
  languageText: string;
  experimentalFeatureCount: number;
}
