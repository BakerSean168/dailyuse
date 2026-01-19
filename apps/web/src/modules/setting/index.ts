/**
 * Setting Module - Public API
 *
 * 此文件是 Setting 模块的统一导出入口
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
export { useUserSettingStore } from './presentation/stores/userSettingStore';
export { useSettingStore } from './presentation/stores/settingStore';

// ===== Application Layer =====
export { UserSettingWebApplicationService } from './application/services/UserSettingWebApplicationService';

/**
 * 使用示例：
 *
 * // 1. 在路由中使用视图
 * import { UserSettingsView } from '@/modules/setting';
 *
 * // 2. 在组件中使用 composable
 * import { useUserSetting } from '@/modules/setting';
 * const { userSetting, switchTheme, switchLanguage } = useUserSetting();
 *
 * // 3. 在组件中使用子组件
 * import { AppearanceSettings } from '@/modules/setting';
 *
 * // 4. 在服务中使用 Application Service
 * import { UserSettingWebApplicationService } from '@/modules/setting';
 * const service = await UserSettingWebApplicationService.getInstance();
 */
