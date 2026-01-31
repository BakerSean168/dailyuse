/**
 * UserSetting Aggregate Root - Server Interface
 * 用户设置聚合�?- 服务端接�?
 */

import type { SettingId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { UserSettingClientDTO } from './user-setting-client';
// ============ DTO 定义 ============

/**
 * UserSetting Server DTO
 */
export interface UserSettingServerDTO {
  id: string;
  identityId: string;
  appearance: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor: string;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily: string | null;
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
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * UserSetting Persistence DTO
 */
/**
 * PersistenceDTO - 扁平化的数据库存储格�?
 * 规范：实体属性扁平化 + 类型转换（适合存储�?
 */
export interface UserSettingPersistenceDTO {
  id: string;
  identityId: string;

  // Appearance - 扁平�?
  appearanceTheme: string; // 'LIGHT' | 'DARK' | 'AUTO'
  appearanceAccentColor: string;
  appearanceFontSize: string; // 'SMALL' | 'MEDIUM' | 'LARGE'
  appearanceFontFamily: string | null;
  appearanceCompactMode: boolean;

  // Locale - 扁平�?
  localeLanguage: string;
  localeTimezone: string;
  localeDateFormat: string; // 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'
  localeTimeFormat: string; // '12H' | '24H'
  localeWeekStartsOn: number; // 0-6
  localeCurrency: string;

  // Workflow - 扁平�?
  workflowDefaultTaskView: string; // 'LIST' | 'KANBAN' | 'CALENDAR'
  workflowDefaultGoalView: string; // 'LIST' | 'TREE' | 'GANTT'
  workflowDefaultScheduleView: string; // 'DAY' | 'WEEK' | 'MONTH'
  workflowAutoSave: boolean;
  workflowAutoSaveInterval: number; // milliseconds
  workflowConfirmBeforeDelete: boolean;

  // Shortcuts - 扁平化为 JSON（因为是动态键值对�?
  shortcutsEnabled: boolean;
  shortcutsCustom: string; // JSON: Record<string, string>

  // Privacy - 扁平�?
  privacyProfileVisibility: string; // 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE'
  privacyShowOnlineStatus: boolean;
  privacyAllowSearchByEmail: boolean;
  privacyAllowSearchByPhone: boolean;
  privacyShareUsageData: boolean;

  // Experimental - 扁平�?
  experimentalEnabled: boolean;
  experimentalFeatures: string; // JSON: string[]

  // Timestamps
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 聚合根接�?============

export interface UserSettingServer {
  id: SettingId;
  identityId: IdentityId;
  appearance: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor: string;
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily: string | null;
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
  createdAt: DomainDate;
  updatedAt: DomainDate;

}
