/**
 * Setting Module - Public API
 */

// ===== Presentation Layer =====

// Views
export { default as UserSettingsView } from './presentation/views/UserSettingsView.vue';

// Components
export { default as AppearanceSettings } from './presentation/components/AppearanceSettings.vue';
export { default as LocaleSettings } from './presentation/components/LocaleSettings.vue';
export { default as WorkflowSettings } from './presentation/components/WorkflowSettings.vue';
export { default as ShortcutSettings } from './presentation/components/ShortcutSettings.vue';
export { default as PrivacySettings } from './presentation/components/PrivacySettings.vue';
export { default as ExperimentalSettings } from './presentation/components/ExperimentalSettings.vue';

// Composables
export { useUserSetting, useUserSettingData } from './presentation/composables/useUserSetting';

// Stores
export { useUserSettingStore, useSettingStore } from './presentation/stores/userSettingStore';
export type { UserSettingStoreType } from './presentation/stores/userSettingStore';

// Initialization
export { registerSettingInitializationTasks } from './initialization';
