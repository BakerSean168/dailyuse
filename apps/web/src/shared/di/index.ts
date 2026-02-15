/**
 * Web Application — Module DI Container
 *
 * 集中管理所有模块的依赖注入。
 * 在 app 启动时创建 HTTP Client 实例，
 * 然后通过工厂函数将其注入到各模块的 Adapter → Service。
 *
 * 统一使用 resultHttpClient (IResultHttpClient) — 所有方法返回 Result<T>。
 *
 * @module shared/di
 */

import type { App, InjectionKey } from 'vue';

// ── Package-level Services & Factories ──
import { AccountClientService, createAccountHttpAdapter } from '@dailyuse/account';
import { AuthClientService, createAuthHttpAdapter } from '@dailyuse/authentication';
import { createRuleHttpAdapter } from '@dailyuse/governance';
import type { IRuleApiClient } from '@dailyuse/governance';
import { GoalClientService, createGoalHttpAdapters } from '@dailyuse/goal';
import { NotificationClientService, createNotificationHttpAdapters } from '@dailyuse/notification';
import { ReminderClientService, createReminderHttpAdapters } from '@dailyuse/reminder';
import { RepositoryClientService, createRepositoryHttpAdapters } from '@dailyuse/repository';
import { ScheduleClientService, createScheduleHttpAdapters } from '@dailyuse/schedule';
import { SettingClientService, createSettingHttpAdapters } from '@dailyuse/setting';
import { TaskClientService, createTaskHttpAdapters } from '@dailyuse/task';

// ── Web App HTTP Client ──
import { resultHttpClient } from '@/shared/http';

// ============================================================================
// Injection Keys
// ============================================================================

export const ACCOUNT_SERVICE_KEY: InjectionKey<AccountClientService> = Symbol('AccountClientService');
export const AUTH_SERVICE_KEY: InjectionKey<AuthClientService> = Symbol('AuthClientService');
export const RULE_API_CLIENT_KEY: InjectionKey<IRuleApiClient> = Symbol('IRuleApiClient');
export const GOAL_SERVICE_KEY: InjectionKey<GoalClientService> = Symbol('GoalClientService');
export const NOTIFICATION_SERVICE_KEY: InjectionKey<NotificationClientService> = Symbol('NotificationClientService');
export const REMINDER_SERVICE_KEY: InjectionKey<ReminderClientService> = Symbol('ReminderClientService');
export const REPOSITORY_SERVICE_KEY: InjectionKey<RepositoryClientService> = Symbol('RepositoryClientService');
export const SCHEDULE_SERVICE_KEY: InjectionKey<ScheduleClientService> = Symbol('ScheduleClientService');
export const SETTING_SERVICE_KEY: InjectionKey<SettingClientService> = Symbol('SettingClientService');
export const TASK_SERVICE_KEY: InjectionKey<TaskClientService> = Symbol('TaskClientService');

// ============================================================================
// Service Instances — All modules use resultHttpClient (IResultHttpClient)
// ============================================================================

// ── Auth ──
const authApiClient = createAuthHttpAdapter(resultHttpClient);
export const authService = new AuthClientService(authApiClient);

// ── Account ──
const accountApiClient = createAccountHttpAdapter(resultHttpClient);
export const accountService = new AccountClientService(accountApiClient);

// ── Governance (Rule API Client only) ──
export const ruleApiClient = createRuleHttpAdapter(resultHttpClient);

// ── Goal ──
const goalAdapters = createGoalHttpAdapters(resultHttpClient);
const goalService = new GoalClientService(goalAdapters.goal, goalAdapters.folder);

// ── Notification ──
const notificationAdapters = createNotificationHttpAdapters(resultHttpClient);
const notificationService = new NotificationClientService(notificationAdapters.notification);

// ── Reminder ──
const reminderAdapters = createReminderHttpAdapters(resultHttpClient);
const reminderService = new ReminderClientService(reminderAdapters.reminder);

// ── Repository ──
const repositoryAdapters = createRepositoryHttpAdapters(resultHttpClient);
const repositoryService = new RepositoryClientService(repositoryAdapters.repository);

// ── Schedule ──
const scheduleAdapters = createScheduleHttpAdapters(resultHttpClient);
const scheduleService = new ScheduleClientService(scheduleAdapters.task, scheduleAdapters.event);

// ── Setting ──
const settingAdapters = createSettingHttpAdapters(resultHttpClient);
const settingService = new SettingClientService(settingAdapters.setting);

// ── Task ──
const taskAdapters = createTaskHttpAdapters(resultHttpClient);
const taskService = new TaskClientService(
  taskAdapters.template,
  taskAdapters.instance,
  taskAdapters.dependency,
  taskAdapters.statistics,
);

// ============================================================================
// Vue Plugin
// ============================================================================

/**
 * 注册所有模块服务到 Vue app provide/inject 上下文。
 *
 * 所有模块统一通过 provide/inject 注入 Service 实例。
 * Composable 层通过 inject(KEY) 获取 Service。
 *
 * @example
 * ```ts
 * // main.ts
 * import { installModuleServices } from '@/shared/di';
 * app.use(installModuleServices);
 * ```
 */
export function installModuleServices(app: App): void {
  app.provide(ACCOUNT_SERVICE_KEY, accountService);
  app.provide(AUTH_SERVICE_KEY, authService);
  app.provide(RULE_API_CLIENT_KEY, ruleApiClient);
  app.provide(GOAL_SERVICE_KEY, goalService);
  app.provide(NOTIFICATION_SERVICE_KEY, notificationService);
  app.provide(REMINDER_SERVICE_KEY, reminderService);
  app.provide(REPOSITORY_SERVICE_KEY, repositoryService);
  app.provide(SCHEDULE_SERVICE_KEY, scheduleService);
  app.provide(SETTING_SERVICE_KEY, settingService);
  app.provide(TASK_SERVICE_KEY, taskService);
}
