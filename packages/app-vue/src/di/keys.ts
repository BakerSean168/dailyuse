/**
 * DI Injection Keys
 *
 * 所有共享模块的 Vue InjectionKey 定义。
 * 宿主应用 (web / desktop) 负责 provide 具体的 Service 实例。
 * app-vue 中的 composables 通过 inject(KEY) 获取服务。
 */

import type { InjectionKey, Ref, ShallowRef } from 'vue';
import type {
  IAccountService,
  IAuthService,
  IGoalService,
  ITaskService,
  IScheduleService,
  IReminderService,
  IRepositoryService,
  INotificationService,
  ISettingService,
  IDataPortabilityService,
  IAIService,
  IRuleService,
  IDashboardService,
  ModuleCapsule,
} from './types';

// ── Domain Service Keys ──
export const ACCOUNT_SERVICE_KEY: InjectionKey<IAccountService> = Symbol('AccountService');
export const AUTH_SERVICE_KEY: InjectionKey<IAuthService> = Symbol('AuthService');
export const GOAL_SERVICE_KEY: InjectionKey<IGoalService> = Symbol('GoalService');
export const TASK_SERVICE_KEY: InjectionKey<ITaskService> = Symbol('TaskService');
export const SCHEDULE_SERVICE_KEY: InjectionKey<IScheduleService> = Symbol('ScheduleService');
export const REMINDER_SERVICE_KEY: InjectionKey<IReminderService> = Symbol('ReminderService');
export const REPOSITORY_SERVICE_KEY: InjectionKey<IRepositoryService> = Symbol('RepositoryService');
export const NOTIFICATION_SERVICE_KEY: InjectionKey<INotificationService> =
  Symbol('NotificationService');
export const SETTING_SERVICE_KEY: InjectionKey<ISettingService> = Symbol('SettingService');
export const DATA_PORTABILITY_SERVICE_KEY: InjectionKey<IDataPortabilityService> =
  Symbol('DataPortabilityService');
export const AI_SERVICE_KEY: InjectionKey<IAIService> = Symbol('AIService');
export const RULE_SERVICE_KEY: InjectionKey<IRuleService> = Symbol('RuleService');
export const DASHBOARD_SERVICE_KEY: InjectionKey<IDashboardService> = Symbol('DashboardService');

// ── UI / Navigation Keys ──
/**
 * V2 shell: ordered list of module capsules rendered in WindowHeader.
 * Hosts may override to add/remove/reorder capsules (Brief §12-4).
 * (Replaced MAIN_NAVIGATION_KEY / BOTTOM_NAVIGATION_KEY of the V1 sidebar.)
 */
export const MODULE_CAPSULES_KEY: InjectionKey<ModuleCapsule[]> = Symbol('ModuleCapsules');
export const USER_NAME_KEY: InjectionKey<string> = Symbol('UserName');
export const LOGOUT_HANDLER_KEY: InjectionKey<() => void> = Symbol('LogoutHandler');

// ── Desktop Platform Keys ──
export const DESKTOP_AUTH_API_KEY: InjectionKey<{
  invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
}> = Symbol('DesktopAuthApi');

export interface DesktopBridge {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
}

export const DESKTOP_BRIDGE_KEY: InjectionKey<DesktopBridge> = Symbol('DesktopBridge');

/** Shell-owned Global Composer teleport mount (HTMLElement). */
export const SHELL_COMPOSER_MOUNT_KEY: InjectionKey<ShallowRef<HTMLElement | null>> =
  Symbol('ShellComposerMount');

/** Shell-owned Global Composer density token. */
export const SHELL_COMPOSER_DENSITY_KEY: InjectionKey<Ref<'comfortable' | 'compact' | 'icon'>> =
  Symbol('ShellComposerDensity');


