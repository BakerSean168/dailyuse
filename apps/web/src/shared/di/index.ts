/**
 * Web Application — Module DI Container
 *
 * 集中管理所有模块的依赖注入。
 * 在 app 启动时创建 ResultHttpClient，
 * 然后通过工厂函数将其注入到各模块的 Adapter → Service。
 *
 * Phase 1 模块 (Auth / Account) 使用 resultHttpClient + provide/inject。
 * Phase 2 模块暂时仍使用旧 httpClient + Container 单例。
 *
 * @module shared/di
 */

import type { App, InjectionKey } from 'vue';

// ── Package-level Services (Phase 1: Account / Auth / Governance) ──
import { AccountClientService, createAccountHttpAdapter } from '@dailyuse/account';
import { AuthClientService, createAuthHttpAdapter } from '@dailyuse/authentication';
import { createRuleHttpAdapter } from '@dailyuse/governance';
import type { IRuleApiClient } from '@dailyuse/governance';

// ── Package-level Containers & Factories (Phase 2: 7 remaining modules) ──
import { GoalContainer, createGoalHttpAdapters } from '@dailyuse/goal';
import { NotificationContainer, createNotificationHttpAdapters } from '@dailyuse/notification';
import { ReminderContainer, createReminderHttpAdapters } from '@dailyuse/reminder';
import { RepositoryContainer, createRepositoryHttpAdapters } from '@dailyuse/repository';
import { ScheduleContainer, createScheduleHttpAdapters } from '@dailyuse/schedule';
import { SettingContainer, createSettingHttpAdapters } from '@dailyuse/setting';
import { TaskContainer, createTaskHttpAdapters } from '@dailyuse/task';

// ── Web App HTTP Client ──
import { httpClient, resultHttpClient } from '@/shared/http';

// ============================================================================
// Injection Keys
// ============================================================================

export const ACCOUNT_SERVICE_KEY: InjectionKey<AccountClientService> = Symbol('AccountClientService');
export const AUTH_SERVICE_KEY: InjectionKey<AuthClientService> = Symbol('AuthClientService');
export const RULE_API_CLIENT_KEY: InjectionKey<IRuleApiClient> = Symbol('IRuleApiClient');

// ============================================================================
// Service Instances (Singleton) — Phase 1 modules (using resultHttpClient)
// ============================================================================

/** Account Service — resultHttpClient → AccountHttpAdapter → AccountClientService */
const accountApiClient = createAccountHttpAdapter(resultHttpClient);
export const accountService = new AccountClientService(accountApiClient);

/** Auth Service — resultHttpClient → AuthHttpAdapter → AuthClientService */
const authApiClient = createAuthHttpAdapter(resultHttpClient);
export const authService = new AuthClientService(authApiClient);

/** Governance Rule API Client — 注入 httpClient → RuleHttpAdapter */
export const ruleApiClient = createRuleHttpAdapter(httpClient as unknown as Parameters<typeof createRuleHttpAdapter>[0]);

// ============================================================================
// Container Registration — Phase 2 modules (still using legacy httpClient)
// ============================================================================

// ── Goal ──
const goalAdapters = createGoalHttpAdapters(httpClient as unknown as Parameters<typeof createGoalHttpAdapters>[0]);
GoalContainer.getInstance()
  .registerApiClient(goalAdapters.goal)
  .registerFolderApiClient(goalAdapters.folder);

// ── Notification ──
const notificationAdapters = createNotificationHttpAdapters(httpClient as unknown as Parameters<typeof createNotificationHttpAdapters>[0]);
NotificationContainer.getInstance()
  .registerApiClient(notificationAdapters.notification);

// ── Reminder ──
const reminderAdapters = createReminderHttpAdapters(httpClient as unknown as Parameters<typeof createReminderHttpAdapters>[0]);
ReminderContainer.getInstance()
  .registerApiClient(reminderAdapters.reminder);

// ── Repository ──
const repositoryAdapters = createRepositoryHttpAdapters(httpClient as unknown as Parameters<typeof createRepositoryHttpAdapters>[0]);
RepositoryContainer.getInstance()
  .registerApiClient(repositoryAdapters.repository);

// ── Schedule ──
const scheduleAdapters = createScheduleHttpAdapters(httpClient as unknown as Parameters<typeof createScheduleHttpAdapters>[0]);
ScheduleContainer.getInstance()
  .registerTaskApiClient(scheduleAdapters.task)
  .registerEventApiClient(scheduleAdapters.event);

// ── Setting ──
const settingAdapters = createSettingHttpAdapters(httpClient as unknown as Parameters<typeof createSettingHttpAdapters>[0]);
SettingContainer.getInstance()
  .registerApiClient(settingAdapters.setting);

// ── Task ──
const taskAdapters = createTaskHttpAdapters(httpClient as unknown as Parameters<typeof createTaskHttpAdapters>[0]);
TaskContainer.getInstance()
  .registerTemplateApiClient(taskAdapters.template)
  .registerInstanceApiClient(taskAdapters.instance)
  .registerDependencyApiClient(taskAdapters.dependency)
  .registerStatisticsApiClient(taskAdapters.statistics);

// ============================================================================
// Vue Plugin
// ============================================================================

/**
 * 注册所有模块服务到 Vue app provide/inject 上下文。
 *
 * Phase 1 模块通过 provide/inject 注入。
 * Phase 2 模块通过各自 Package Container 单例注入（composable 使用 httpClient 直接调用）。
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
}
