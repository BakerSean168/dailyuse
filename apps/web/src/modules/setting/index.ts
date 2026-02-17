/**
 * Setting Module - Public API
 */

// ===== Presentation Layer =====

// Views
export { default as UserSettingsView } from './presentation/views/UserSettingsView.vue';

// Components - re-exported from ui-vue-shadcn
export {
  AppearanceSettings,
  EditorSettings,
  ExperimentalSettings,
  LocaleSettings,
  PrivacySettings,
  RepositorySettings,
  SettingAdvancedActions,
  ShortcutSettings,
  WorkflowSettings,
} from '@dailyuse/ui-vue-shadcn';

// Composables
export { useUserSetting, useUserSettingData } from './presentation/composables/useUserSetting';

// Stores
export { useUserSettingStore, useSettingStore } from './presentation/stores/userSettingStore';
export type { UserSettingStoreType } from './presentation/stores/userSettingStore';

// Initialization
export { registerSettingInitializationTasks } from './initialization';
