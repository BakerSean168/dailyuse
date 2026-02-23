/**
 * Prisma UserSetting Mapper
 *
 * Maps between UserSetting domain aggregate and Prisma model.
 *
 * 【映射约定】
 * Prisma 列名采用 camelCase 拼接: category + Field
 *   appearance.theme       → appearanceTheme
 *   locale.weekStartsOn    → localeWeekStartsOn
 *   notification.email     → notificationEmail
 *
 * 特殊字段（JSON 序列化存储）：
 *   shortcuts.custom       → shortcutsCustom (JSON string ↔ Record)
 *   experimental.features  → experimentalFeatures (JSON string ↔ string[])
 */

import type { UserSetting as PrismaUserSetting } from '@dailyuse/database';
import { UserSetting, type UserSettingState } from '@/domain-server/aggregates/user-setting';
import { SettingId } from '@/domain-shared/value-objects/setting-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';
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
} from '@dailyuse/contracts/setting';
import { createDefaultPreferences } from '@dailyuse/contracts/setting';

export class PrismaUserSettingMapper {
  /**
   * Prisma → Domain
   */
  static toDomain(data: PrismaUserSetting): UserSetting {
    const defaults = createDefaultPreferences();

    const appearance: AppearancePreferences = {
      theme: data.appearanceTheme ?? defaults.appearance.theme,
      fontSize: typeof data.appearanceFontSize === 'string'
        ? parseInt(data.appearanceFontSize, 10) || defaults.appearance.fontSize
        : defaults.appearance.fontSize,
      compactMode: data.appearanceCompactMode ?? defaults.appearance.compactMode,
      accentColor: data.appearanceAccentColor ?? defaults.appearance.accentColor,
      fontFamily: data.appearanceFontFamily ?? defaults.appearance.fontFamily,
    };

    const locale: LocalePreferences = {
      language: data.localeLanguage ?? defaults.locale.language,
      timezone: data.localeTimezone ?? defaults.locale.timezone,
      dateFormat: data.localeDateFormat ?? defaults.locale.dateFormat,
      timeFormat: data.localeTimeFormat ?? defaults.locale.timeFormat,
      currency: data.localeCurrency ?? defaults.locale.currency,
      weekStartsOn: data.localeWeekStartsOn ?? defaults.locale.weekStartsOn,
    };

    const workflow: WorkflowPreferences = {
      autoSave: data.workflowAutoSave ?? defaults.workflow.autoSave,
      autoSaveInterval: data.workflowAutoSaveInterval ?? defaults.workflow.autoSaveInterval,
      confirmBeforeDelete: data.workflowConfirmBeforeDelete ?? defaults.workflow.confirmBeforeDelete,
      defaultTaskView: data.workflowDefaultTaskView ?? defaults.workflow.defaultTaskView,
      defaultGoalView: data.workflowDefaultGoalView ?? defaults.workflow.defaultGoalView,
      defaultScheduleView: data.workflowDefaultScheduleView ?? defaults.workflow.defaultScheduleView,
    };

    const privacy: PrivacyPreferences = {
      profileVisibility: data.privacyProfileVisibility ?? defaults.privacy.profileVisibility,
      showOnlineStatus: data.privacyShowOnlineStatus ?? defaults.privacy.showOnlineStatus,
      shareUsageData: data.privacyShareUsageData ?? defaults.privacy.shareUsageData,
      allowSearchByEmail: data.privacyAllowSearchByEmail ?? defaults.privacy.allowSearchByEmail,
      allowSearchByPhone: data.privacyAllowSearchByPhone ?? defaults.privacy.allowSearchByPhone,
    };

    const notification: NotificationPreferences = {
      email: data.notificationEmail ?? defaults.notification.email,
      push: data.notificationPush ?? defaults.notification.push,
      inApp: data.notificationInApp ?? defaults.notification.inApp,
      sound: data.notificationSound ?? defaults.notification.sound,
    };

    const editor: EditorPreferences = {
      theme: data.editorTheme ?? defaults.editor.theme,
      fontSize: data.editorFontSize ?? defaults.editor.fontSize,
      tabSize: data.editorTabSize ?? defaults.editor.tabSize,
      wordWrap: data.editorWordWrap ?? defaults.editor.wordWrap,
      lineNumbers: data.editorLineNumbers ?? defaults.editor.lineNumbers,
      minimap: data.editorMinimap ?? defaults.editor.minimap,
    };

    const shortcuts: ShortcutPreferences = {
      enabled: data.shortcutsEnabled ?? defaults.shortcuts.enabled,
      custom: safeJsonParse(data.shortcutsCustom, defaults.shortcuts.custom),
    };

    const experimental: ExperimentalPreferences = {
      enabled: data.experimentalEnabled ?? defaults.experimental.enabled,
      features: safeJsonParse(data.experimentalFeatures, defaults.experimental.features),
    };

    const ui: UIStatePreferences = {
      startPage: data.startPage ?? defaults.ui.startPage,
      sidebarCollapsed: data.sidebarCollapsed ?? defaults.ui.sidebarCollapsed,
    };

    const state: UserSettingState = {
      id: SettingId.of(data.id),
      identityId: IdentityId.of(data.identityId),
      appearance,
      locale,
      workflow,
      privacy,
      notification,
      editor,
      shortcuts,
      experimental,
      ui,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    };

    return UserSetting.load(state);
  }

  /**
   * Domain → Prisma write data
   */
  static toPersistence(setting: UserSetting): Record<string, unknown> {
    return {
      id: setting.id,
      identityId: setting.identityId,
      version: setting.version,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
      deletedAt: setting.deletedAt,

      // Appearance
      appearanceTheme: setting.appearance.theme,
      appearanceFontSize: String(setting.appearance.fontSize),
      appearanceCompactMode: setting.appearance.compactMode,
      appearanceAccentColor: setting.appearance.accentColor,
      appearanceFontFamily: setting.appearance.fontFamily,

      // Locale
      localeLanguage: setting.locale.language,
      localeTimezone: setting.locale.timezone,
      localeDateFormat: setting.locale.dateFormat,
      localeTimeFormat: setting.locale.timeFormat,
      localeCurrency: setting.locale.currency,
      localeWeekStartsOn: setting.locale.weekStartsOn,

      // Workflow
      workflowAutoSave: setting.workflow.autoSave,
      workflowAutoSaveInterval: setting.workflow.autoSaveInterval,
      workflowConfirmBeforeDelete: setting.workflow.confirmBeforeDelete,
      workflowDefaultTaskView: setting.workflow.defaultTaskView,
      workflowDefaultGoalView: setting.workflow.defaultGoalView,
      workflowDefaultScheduleView: setting.workflow.defaultScheduleView,

      // Privacy
      privacyProfileVisibility: setting.privacy.profileVisibility,
      privacyShowOnlineStatus: setting.privacy.showOnlineStatus,
      privacyShareUsageData: setting.privacy.shareUsageData,
      privacyAllowSearchByEmail: setting.privacy.allowSearchByEmail,
      privacyAllowSearchByPhone: setting.privacy.allowSearchByPhone,

      // Notification
      notificationEmail: setting.notification.email,
      notificationPush: setting.notification.push,
      notificationInApp: setting.notification.inApp,
      notificationSound: setting.notification.sound,

      // Editor
      editorTheme: setting.editor.theme,
      editorFontSize: setting.editor.fontSize,
      editorTabSize: setting.editor.tabSize,
      editorWordWrap: setting.editor.wordWrap,
      editorLineNumbers: setting.editor.lineNumbers,
      editorMinimap: setting.editor.minimap,

      // Shortcuts (JSON serialized)
      shortcutsEnabled: setting.shortcuts.enabled,
      shortcutsCustom: JSON.stringify(setting.shortcuts.custom),

      // Experimental (JSON serialized)
      experimentalEnabled: setting.experimental.enabled,
      experimentalFeatures: JSON.stringify(setting.experimental.features),

      // UI State
      startPage: setting.ui.startPage,
      sidebarCollapsed: setting.ui.sidebarCollapsed,
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

