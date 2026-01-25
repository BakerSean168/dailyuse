/**
 * UserSetting Aggregate Root - Client Interface
 * 用户设置聚合根 - 客户端接口
 */

import type { UserSettingServerDTO } from './UserSettingServer';

// ============ DTO 定义 ============

/**
 * UserSetting Client DTO
 */
export interface UserSettingClientDTO {
  uuid: string;
  accountUuid: string;
  appearance: {
    theme: string;
    accentColor: string;
    fontSize: string;
    fontFamily?: string | null;
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
  createdAt: number;
  updatedAt: number;
  themeText: string;
  languageText: string;
  experimentalFeatureCount: number;
}

// ============ 聚合根接口 ============

export interface UserSettingClient {
  uuid: string;
  accountUuid: string;
  appearance: {
    theme: string;
    accentColor: string;
    fontSize: string;
    fontFamily?: string | null;
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
  createdAt: Date;
  updatedAt: Date;
  themeText: string;
  languageText: string;
  experimentalFeatureCount: number;

  // UI 方法
  getThemeText(): string;
  getLanguageText(): string;
  getShortcutText(action: string): string;
  getShortcut(action: string): string | null;
  hasShortcut(action: string): boolean;
  hasExperimentalFeature(feature: string): boolean;

  toServerDTO(): UserSettingServerDTO;
}

export interface UserSettingClientStatic {
  create(params: {
    accountUuid: string;
    appearance?: Partial<UserSettingClient['appearance']>;
    locale?: Partial<UserSettingClient['locale']>;
    workflow?: Partial<UserSettingClient['workflow']>;
    shortcuts?: Partial<UserSettingClient['shortcuts']>;
    privacy?: Partial<UserSettingClient['privacy']>;
    experimental?: Partial<UserSettingClient['experimental']>;
  }): UserSettingClient;
  fromServerDTO(dto: UserSettingServerDTO): UserSettingClient;
  fromClientDTO(dto: UserSettingClientDTO): UserSettingClient;
}
