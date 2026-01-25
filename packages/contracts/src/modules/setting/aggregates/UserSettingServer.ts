/**
 * UserSetting Aggregate Root - Server Interface
 * 用户设置聚合根 - 服务端接口
 */

import type { UserSettingClientDTO } from './UserSettingClient';
// ============ DTO 定义 ============

/**
 * UserSetting Server DTO
 */
export interface UserSettingServerDTO {
  uuid: string;
  accountUuid: string;
  appearance: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor: string;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily?: string | null;
    compactMode: boolean;
  };
  locale: {
    language: string;
    timezone: string;
    dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat: '12H' | '24H';
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    currency: string;
  };
  workflow: {
    defaultTaskView: 'LIST' | 'KANBAN' | 'CALENDAR';
    defaultGoalView: 'LIST' | 'TREE' | 'TIMELINE';
    defaultScheduleView: 'DAY' | 'WEEK' | 'MONTH';
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
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
}

/**
 * UserSetting Persistence DTO
 */
/**
 * PersistenceDTO - 扁平化的数据库存储格式
 * 规范：实体属性扁平化 + 类型转换（适合存储）
 */
export interface UserSettingPersistenceDTO {
  uuid: string;
  accountUuid: string;

  // Appearance - 扁平化
  appearanceTheme: string; // 'LIGHT' | 'DARK' | 'AUTO'
  appearanceAccentColor: string;
  appearanceFontSize: string; // 'SMALL' | 'MEDIUM' | 'LARGE'
  appearanceFontFamily: string | null;
  appearanceCompactMode: boolean;

  // Locale - 扁平化
  localeLanguage: string;
  localeTimezone: string;
  localeDateFormat: string; // 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'
  localeTimeFormat: string; // '12H' | '24H'
  localeWeekStartsOn: number; // 0-6
  localeCurrency: string;

  // Workflow - 扁平化
  workflowDefaultTaskView: string; // 'LIST' | 'KANBAN' | 'CALENDAR'
  workflowDefaultGoalView: string; // 'LIST' | 'TREE' | 'GANTT'
  workflowDefaultScheduleView: string; // 'DAY' | 'WEEK' | 'MONTH'
  workflowAutoSave: boolean;
  workflowAutoSaveInterval: number; // milliseconds
  workflowConfirmBeforeDelete: boolean;

  // Shortcuts - 扁平化为 JSON（因为是动态键值对）
  shortcutsEnabled: boolean;
  shortcutsCustom: string; // JSON: Record<string, string>

  // Privacy - 扁平化
  privacyProfileVisibility: string; // 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE'
  privacyShowOnlineStatus: boolean;
  privacyAllowSearchByEmail: boolean;
  privacyAllowSearchByPhone: boolean;
  privacyShareUsageData: boolean;

  // Experimental - 扁平化
  experimentalEnabled: boolean;
  experimentalFeatures: string; // JSON: string[]

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============ 聚合根接口 ============

export interface UserSettingServer {
  uuid: string;
  accountUuid: string;
  appearance: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor: string;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily?: string | null;
    compactMode: boolean;
  };
  locale: {
    language: string;
    timezone: string;
    dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat: '12H' | '24H';
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    currency: string;
  };
  workflow: {
    defaultTaskView: 'LIST' | 'KANBAN' | 'CALENDAR';
    defaultGoalView: 'LIST' | 'TREE' | 'TIMELINE';
    defaultScheduleView: 'DAY' | 'WEEK' | 'MONTH';
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
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

  // 外观管理
  updateAppearance(appearance: Partial<UserSettingServer['appearance']>): void;
  updateTheme(theme: 'LIGHT' | 'DARK' | 'AUTO'): void;

  // 语言和区域
  updateLocale(locale: Partial<UserSettingServer['locale']>): void;
  updateLanguage(language: string): void;
  updateTimezone(timezone: string): void;

  // 工作流
  updateWorkflow(workflow: Partial<UserSettingServer['workflow']>): void;

  // 快捷键
  updateShortcut(action: string, shortcut: string): void;
  removeShortcut(action: string): void;

  // 隐私
  updatePrivacy(privacy: Partial<UserSettingServer['privacy']>): void;

  // 实验性功能
  enableExperimentalFeature(feature: string): void;
  disableExperimentalFeature(feature: string): void;

  toServerDTO(): UserSettingServerDTO;
  toClientDTO(): UserSettingClientDTO;
  toPersistenceDTO(): UserSettingPersistenceDTO;
}

export interface UserSettingServerStatic {
  create(params: {
    accountUuid: string;
    appearance?: Partial<UserSettingServer['appearance']>;
    locale?: Partial<UserSettingServer['locale']>;
    workflow?: Partial<UserSettingServer['workflow']>;
    shortcuts?: Partial<UserSettingServer['shortcuts']>;
    privacy?: Partial<UserSettingServer['privacy']>;
    experimental?: Partial<UserSettingServer['experimental']>;
  }): UserSettingServer;
  fromServerDTO(dto: UserSettingServerDTO): UserSettingServer;
  fromPersistenceDTO(dto: UserSettingPersistenceDTO): UserSettingServer;
}
