/**
 * Web Platform — DI Container
 *
 * 集中管理所有模块的依赖注入。
 * 创建 HTTP 适配器 → 构建 Service 实例 → 通过 Vue provide/inject 注入。
 *
 * 统一使用 resultHttpClient (IResultHttpClient) — 所有方法返回 Result<T>。
 *
 * @module platform/di
 */

import type { App } from 'vue';
import {
  // Domain service keys
  ACCOUNT_SERVICE_KEY,
  AUTH_SERVICE_KEY,
  GOAL_SERVICE_KEY,
  NOTIFICATION_SERVICE_KEY,
  REMINDER_SERVICE_KEY,
  REPOSITORY_SERVICE_KEY,
  RULE_SERVICE_KEY,
  SCHEDULE_SERVICE_KEY,
  SETTING_SERVICE_KEY,
  TASK_SERVICE_KEY,
  // Infrastructure keys
  HTTP_CLIENT_KEY,
  // UI keys
  MAIN_NAVIGATION_KEY,
  BOTTOM_NAVIGATION_KEY,
  LOGOUT_HANDLER_KEY,
  // Default navigation
  defaultMainNavigation,
  defaultBottomNavigation,
  // Store
  useAuthenticationStore,
} from '@dailyuse/app-vue';

// ── Adapter Factories (subpath imports to avoid bundling server code) ──
import { AccountClientService } from '@dailyuse/account/application-client';
import { createAccountHttpAdapter } from '@dailyuse/account/infrastructure-client';
import { AuthClientService } from '@dailyuse/authentication/application-client';
import { createAuthHttpAdapter } from '@dailyuse/authentication/infrastructure-client';
import { createRuleHttpAdapter } from '@dailyuse/governance/infrastructure-client';
import { GoalClientService } from '@dailyuse/goal/application-client';
import { createGoalHttpAdapters } from '@dailyuse/goal/infrastructure-client';
import { NotificationClientService } from '@dailyuse/notification/application-client';
import { createNotificationHttpAdapters } from '@dailyuse/notification/infrastructure-client';
import { ReminderClientService } from '@dailyuse/reminder/application-client';
import { createReminderHttpAdapters } from '@dailyuse/reminder/infrastructure-client';
import { RepositoryClientService } from '@dailyuse/repository/application-client';
import { createRepositoryHttpAdapters } from '@dailyuse/repository/infrastructure-client';
import { ScheduleClientService } from '@dailyuse/schedule/application-client';
import { createScheduleHttpAdapters } from '@dailyuse/schedule/infrastructure-client';
import { SettingClientService } from '@dailyuse/setting/application-client';
import { createSettingHttpAdapters } from '@dailyuse/setting/infrastructure-client';
import { TaskClientService } from '@dailyuse/task/application-client';
import { createTaskHttpAdapters } from '@dailyuse/task/infrastructure-client';

import { resultHttpClient } from './http';

// ============================================================================
// Service Instances
// ============================================================================

const authService = new AuthClientService(createAuthHttpAdapter(resultHttpClient));
const accountService = new AccountClientService(createAccountHttpAdapter(resultHttpClient));
const ruleApiClient = createRuleHttpAdapter(resultHttpClient);

const goalAdapters = createGoalHttpAdapters(resultHttpClient);
const goalService = new GoalClientService(goalAdapters.goal, goalAdapters.folder);

const notificationAdapters = createNotificationHttpAdapters(resultHttpClient);
const notificationService = new NotificationClientService(notificationAdapters.notification);

const reminderAdapters = createReminderHttpAdapters(resultHttpClient);
const reminderService = new ReminderClientService(reminderAdapters.reminder);

const repositoryAdapters = createRepositoryHttpAdapters(resultHttpClient);
const repositoryService = new RepositoryClientService(repositoryAdapters.repository);

const scheduleAdapters = createScheduleHttpAdapters(resultHttpClient);
const scheduleService = new ScheduleClientService(scheduleAdapters.event, scheduleAdapters.task);

const settingAdapters = createSettingHttpAdapters(resultHttpClient);
const settingService = new SettingClientService(settingAdapters.setting);

const taskAdapters = createTaskHttpAdapters(resultHttpClient);
const taskService = new TaskClientService(
  taskAdapters.template,
  taskAdapters.instance,
  taskAdapters.dependency,
);

// ============================================================================
// Vue Plugin
// ============================================================================

/**
 * 注册所有模块服务 + UI 导航到 Vue provide/inject 上下文。
 *
 * @example
 * ```ts
 * // main.ts
 * app.use(installWebServices);
 * ```
 */
export function installWebServices(app: App): void {
  // ── Domain Services ──
  app.provide(ACCOUNT_SERVICE_KEY, accountService);
  app.provide(AUTH_SERVICE_KEY, authService);
  app.provide(RULE_SERVICE_KEY, ruleApiClient);
  app.provide(GOAL_SERVICE_KEY, goalService);
  app.provide(NOTIFICATION_SERVICE_KEY, notificationService);
  app.provide(REMINDER_SERVICE_KEY, reminderService);
  app.provide(REPOSITORY_SERVICE_KEY, repositoryService);
  app.provide(SCHEDULE_SERVICE_KEY, scheduleService);
  app.provide(SETTING_SERVICE_KEY, settingService);
  app.provide(TASK_SERVICE_KEY, taskService);

  // ── Infrastructure ──
  app.provide(HTTP_CLIENT_KEY, resultHttpClient);

  // ── UI / Navigation ──
  app.provide(MAIN_NAVIGATION_KEY, defaultMainNavigation);
  app.provide(BOTTOM_NAVIGATION_KEY, defaultBottomNavigation);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    const authStore = useAuthenticationStore();
    authStore.reset();
    window.location.href = '/auth';
  });
}
