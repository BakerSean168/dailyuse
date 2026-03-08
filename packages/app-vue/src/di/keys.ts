/**
 * DI Injection Keys
 *
 * 所有共享模块的 Vue InjectionKey 定义。
 * 宿主应用 (web / desktop) 负责 provide 具体的 Service 实例。
 * app-vue 中的 composables 通过 inject(KEY) 获取服务。
 */

import type { InjectionKey } from 'vue';
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
  IRuleService,
  IDashboardService,
  NavigationItem,
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
export const RULE_SERVICE_KEY: InjectionKey<IRuleService> = Symbol('RuleService');
export const DASHBOARD_SERVICE_KEY: InjectionKey<IDashboardService> = Symbol('DashboardService');

// ── UI / Navigation Keys ──
export const MAIN_NAVIGATION_KEY: InjectionKey<NavigationItem[]> = Symbol('MainNavigation');
export const BOTTOM_NAVIGATION_KEY: InjectionKey<NavigationItem[]> = Symbol('BottomNavigation');
export const USER_NAME_KEY: InjectionKey<string> = Symbol('UserName');
export const LOGOUT_HANDLER_KEY: InjectionKey<() => void> = Symbol('LogoutHandler');
