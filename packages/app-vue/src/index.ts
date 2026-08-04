// ── DI ──
export {
  ACCOUNT_SERVICE_KEY,
  AUTH_SERVICE_KEY,
  GOAL_SERVICE_KEY,
  NOTIFICATION_SERVICE_KEY,
  REMINDER_SERVICE_KEY,
  REPOSITORY_SERVICE_KEY,
  RULE_SERVICE_KEY,
  SCHEDULE_SERVICE_KEY,
  SETTING_SERVICE_KEY,
  AI_SERVICE_KEY,
  TASK_SERVICE_KEY,
  DASHBOARD_SERVICE_KEY,
  DESKTOP_AUTH_API_KEY,
  DESKTOP_BRIDGE_KEY,
  PROFILE_LOCK_HANDLER_KEY,
  type ElectronBridge,
  MODULE_CAPSULES_KEY,
  LOGOUT_HANDLER_KEY,
} from './di/keys';
export type {} from './di/types';
export { defaultModuleCapsules } from './di/navigation';

// ── Plugins ──
export { createI18nPlugin, loadLocaleMessages } from './plugins/i18n';

// ── Layouts ──
// V2 shell (UI redesign): AppShell replaced MainLayout as the root of the
// authenticated route tree (S1 switch, UI_REDESIGN_V2_PLAN §10).
export { default as AuthLayout } from './layouts/AuthLayout.vue';
export * from './layouts/shell';
export { default as DesktopProfileAccessView } from './views/DesktopProfileAccessView.vue';

// ── Shared ──
export { readDesktopAccessSnapshot } from './shared/utils/desktop-profile-access';
export { GlobalErrorBoundary, GlobalProgressBar } from './shared/components';
export { useDesktopWindowControls } from './shared/composables/useDesktopWindowControls';

// ── Router ──
export { createAppRouter } from './router';

// ── Dashboard adapters ──
export { createDashboardIpcAdapter, createDashboardHttpAdapter } from './modules/dashboard/adapters';

// ── Stores (consumed by app containers for DI/provide) ──
export { useAuthenticationStore } from './modules/authentication';
export { useAccountStore } from './modules/account';
export { useGoalStore } from './modules/goal';
export { useTaskStore } from './modules/task';
export { useScheduleStore } from './modules/schedule';
export { useReminderStore } from './modules/reminder';
export { useNotificationStore } from './modules/notification';
export { useUserSettingStore } from './modules/setting';
export { useGovernanceStore } from './modules/governance';
export { usePresentationPreferenceStore } from './modules/setting';

// ── Startup hooks ──
export { createNotificationStartupHook } from './modules/notification';
export { createGoalStartupHook } from './modules/goal';


// ── Theme / presentation ──
export { useLocaleSync, usePresentationBootstrap, useThemeSync } from './modules/setting';
