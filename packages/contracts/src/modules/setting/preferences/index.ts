/**
 * Setting Preferences — Typed per-category preference interfaces
 *
 * 这些接口定义了每个设置分类的完整类型结构。
 * 被 domain-server/domain-client/infrastructure 层共同使用。
 *
 * 【扩展指南】
 * 添加新设置项：在对应分类接口中添加字段 + SETTING_REGISTRY 中添加条目 + Prisma schema 添加列
 * 添加新分类：创建新接口 + 添加到 UserSettingPreferences + 添加 DEFAULT_XXX 常量
 */

export type {
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

export {
  DEFAULT_APPEARANCE,
  DEFAULT_LOCALE,
  DEFAULT_WORKFLOW,
  DEFAULT_PRIVACY,
  DEFAULT_NOTIFICATION,
  DEFAULT_EDITOR,
  DEFAULT_SHORTCUTS,
  DEFAULT_EXPERIMENTAL,
  DEFAULT_UI_STATE,
  createDefaultPreferences,
  PREFERENCE_CATEGORIES,
  type PreferenceCategory,
} from './defaults';
