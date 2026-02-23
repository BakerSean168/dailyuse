/**
 * Setting Preference Defaults — Typed default values for each category
 *
 * 这些常量提供了每个分类的"开箱即用"默认值。
 * 当新用户创建 UserSetting 聚合时，使用这些默认值初始化。
 *
 * 注意：这些默认值应与 SETTING_REGISTRY 中各项的 defaultValue 保持一致。
 * SETTING_REGISTRY 用于单项验证，这里用于整体初始化。
 */

import type {
  AppearancePreferences,
  LocalePreferences,
  WorkflowPreferences,
  PrivacyPreferences,
  NotificationPreferences,
  EditorPreferences,
  ShortcutPreferences,
  ExperimentalPreferences,
  UIStatePreferences,
  UserSettingPreferences,
} from './types';

// ─── Category 列表（方便遍历） ────────────────────────────

export const PREFERENCE_CATEGORIES = [
  'appearance',
  'locale',
  'workflow',
  'privacy',
  'notification',
  'editor',
  'shortcuts',
  'experimental',
  'ui',
] as const;

export type PreferenceCategory = (typeof PREFERENCE_CATEGORIES)[number];

// ─── Per-Category Defaults ────────────────────────────────

export const DEFAULT_APPEARANCE: Readonly<AppearancePreferences> = {
  theme: 'auto',
  fontSize: 14,
  compactMode: false,
  accentColor: '#3B82F6',
  fontFamily: null,
};

export const DEFAULT_LOCALE: Readonly<LocalePreferences> = {
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24H',
  currency: 'CNY',
  weekStartsOn: 1,
};

export const DEFAULT_WORKFLOW: Readonly<WorkflowPreferences> = {
  autoSave: true,
  autoSaveInterval: 30000,
  confirmBeforeDelete: true,
  defaultTaskView: 'LIST',
  defaultGoalView: 'LIST',
  defaultScheduleView: 'WEEK',
};

export const DEFAULT_PRIVACY: Readonly<PrivacyPreferences> = {
  profileVisibility: 'PRIVATE',
  showOnlineStatus: true,
  shareUsageData: false,
  allowSearchByEmail: true,
  allowSearchByPhone: false,
};

export const DEFAULT_NOTIFICATION: Readonly<NotificationPreferences> = {
  email: true,
  push: true,
  inApp: true,
  sound: true,
};

export const DEFAULT_EDITOR: Readonly<EditorPreferences> = {
  theme: 'default',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  minimap: true,
};

export const DEFAULT_SHORTCUTS: Readonly<ShortcutPreferences> = {
  enabled: true,
  custom: {},
};

export const DEFAULT_EXPERIMENTAL: Readonly<ExperimentalPreferences> = {
  enabled: false,
  features: [],
};

export const DEFAULT_UI_STATE: Readonly<UIStatePreferences> = {
  startPage: 'dashboard',
  sidebarCollapsed: false,
};

// ─── Factory：创建完整的默认偏好 ──────────────────────────

export function createDefaultPreferences(): UserSettingPreferences {
  return {
    appearance: { ...DEFAULT_APPEARANCE },
    locale: { ...DEFAULT_LOCALE },
    workflow: { ...DEFAULT_WORKFLOW },
    privacy: { ...DEFAULT_PRIVACY },
    notification: { ...DEFAULT_NOTIFICATION },
    editor: { ...DEFAULT_EDITOR },
    shortcuts: { ...DEFAULT_SHORTCUTS },
    experimental: { ...DEFAULT_EXPERIMENTAL },
    ui: { ...DEFAULT_UI_STATE },
  };
}
