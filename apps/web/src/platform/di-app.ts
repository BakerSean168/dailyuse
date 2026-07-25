/**
 * Web Platform - full app DI container.
 *
 * Feature services are created via each package's public client seam.
 * Feature services are created via each package's public `client` seam.
 * Heavy feature services are loaded on demand so the post-login app shell
 * does not pay for every module up front.
 */

import type { App } from 'vue';
import {
  ACCOUNT_SERVICE_KEY,
  AUTH_SERVICE_KEY,
  GOAL_SERVICE_KEY,
  NOTIFICATION_SERVICE_KEY,
  REMINDER_SERVICE_KEY,
  REPOSITORY_SERVICE_KEY,
  RULE_SERVICE_KEY,
  SCHEDULE_SERVICE_KEY,
  SETTING_SERVICE_KEY,
  DATA_PORTABILITY_SERVICE_KEY,
  AI_SERVICE_KEY,
  TASK_SERVICE_KEY,
  DASHBOARD_SERVICE_KEY,
  MODULE_CAPSULES_KEY,
  LOGOUT_HANDLER_KEY,
  defaultModuleCapsules,
  useAuthenticationStore,
} from '@dailyuse/app-vue/web-core';
import { resultHttpClient } from './http';
import { createLazyService } from './lazy-service';

const authService = createLazyService(async () => {
  const { createAuthenticationHttpClient } = await import('@dailyuse/authentication/client');
  return createAuthenticationHttpClient(resultHttpClient);
});

const accountService = createLazyService(async () => {
  const { createAccountHttpClient } = await import('@dailyuse/account/client');
  return createAccountHttpClient(resultHttpClient);
});

const ruleService = createLazyService(async () => {
  const { createGovernanceHttpClient } = await import('@dailyuse/governance/client');
  return createGovernanceHttpClient(resultHttpClient);
});

const goalService = createLazyService(async () => {
  const { createGoalHttpClient } = await import('@dailyuse/goal/client');
  return createGoalHttpClient(resultHttpClient);
});

const notificationService = createLazyService(async () => {
  const { createNotificationHttpClient } = await import('@dailyuse/notification/client');
  return createNotificationHttpClient(resultHttpClient);
});

const reminderService = createLazyService(async () => {
  const { createReminderHttpClient } = await import('@dailyuse/reminder/client');
  return createReminderHttpClient(resultHttpClient);
});

const repositoryService = createLazyService(async () => {
  const { createRepositoryHttpClient } = await import('@dailyuse/repository/client');
  return createRepositoryHttpClient(resultHttpClient);
});

const scheduleService = createLazyService(async () => {
  const { createScheduleHttpClient } = await import('@dailyuse/schedule/client');
  return createScheduleHttpClient(resultHttpClient);
});

const settingService = createLazyService(async () => {
  const { createSettingHttpClient } = await import('@dailyuse/setting/client');
  return createSettingHttpClient(resultHttpClient);
});

const dataPortabilityService = createLazyService(async () => {
  const { createDataPortabilityHttpClient } = await import('@dailyuse/data-portability/client');
  return createDataPortabilityHttpClient(resultHttpClient);
});

const aiService = createLazyService(async () => {
  const { createAIHttpClient } = await import('@dailyuse/ai/client');
  return createAIHttpClient(resultHttpClient);
});

const taskService = createLazyService(async () => {
  const { createTaskHttpClient } = await import('@dailyuse/task/client');
  return createTaskHttpClient(resultHttpClient);
});

const dashboardService = createLazyService(async () => {
  const { createDashboardHttpAdapter } = await import('@dailyuse/app-vue/web-entry');
  return createDashboardHttpAdapter(resultHttpClient);
});

export function installAppServices(app: App): void {
  app.provide(ACCOUNT_SERVICE_KEY, accountService);
  app.provide(AUTH_SERVICE_KEY, authService);
  app.provide(RULE_SERVICE_KEY, ruleService);
  app.provide(GOAL_SERVICE_KEY, goalService);
  app.provide(NOTIFICATION_SERVICE_KEY, notificationService);
  app.provide(REMINDER_SERVICE_KEY, reminderService);
  app.provide(REPOSITORY_SERVICE_KEY, repositoryService);
  app.provide(SCHEDULE_SERVICE_KEY, scheduleService);
  app.provide(SETTING_SERVICE_KEY, settingService);
  app.provide(DATA_PORTABILITY_SERVICE_KEY, dataPortabilityService);
  app.provide(AI_SERVICE_KEY, aiService);
  app.provide(TASK_SERVICE_KEY, taskService);

  app.provide(DASHBOARD_SERVICE_KEY, dashboardService);
  // V2 shell capsule navigation (UI_REDESIGN_V2_PLAN §2.2 / Brief §12-4)
  app.provide(MODULE_CAPSULES_KEY, defaultModuleCapsules);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    const authStore = useAuthenticationStore();
    authStore.reset();
    window.location.replace('/auth');
  });
}
