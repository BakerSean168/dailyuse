/**
 * Web Platform — full app DI container.
 *
 * All feature services are created via the shared `createXxxServiceFromHttpClient`
 * factory language exported by each package's application-client layer.
 * Heavy feature services are loaded on demand so the post-login app shell
 * does not pay for every module up front.
 */

import type { App } from 'vue';
import {
  ACCOUNT_SERVICE_KEY,
  AUTH_SERVICE_KEY,
  GOAL_SERVICE_KEY,
  EDITOR_SERVICE_KEY,
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
  MAIN_NAVIGATION_KEY,
  BOTTOM_NAVIGATION_KEY,
  LOGOUT_HANDLER_KEY,
  defaultMainNavigation,
  defaultBottomNavigation,
  useAuthenticationStore,
} from '@dailyuse/app-vue/web-core';
import { setEditorRuntimeService } from '@dailyuse/app-vue';
import { resultHttpClient } from './http';
import { createLazyService } from './lazy-service';

const authService = createLazyService(async () => {
  const { createAuthenticationServiceFromHttpClient } = await import(
    '@dailyuse/authentication/application-client'
  );
  return createAuthenticationServiceFromHttpClient(resultHttpClient);
});

const accountService = createLazyService(async () => {
  const { createAccountServiceFromHttpClient } = await import(
    '@dailyuse/account/application-client'
  );
  return createAccountServiceFromHttpClient(resultHttpClient);
});

const ruleService = createLazyService(async () => {
  const { createGovernanceServiceFromHttpClient } = await import(
    '@dailyuse/governance/application-client'
  );
  return createGovernanceServiceFromHttpClient(resultHttpClient);
});

const goalService = createLazyService(async () => {
  const { createGoalServiceFromHttpClient } = await import(
    '@dailyuse/goal/application-client'
  );
  return createGoalServiceFromHttpClient(resultHttpClient);
});

const notificationService = createLazyService(async () => {
  const { createNotificationServiceFromHttpClient } = await import(
    '@dailyuse/notification/application-client'
  );
  return createNotificationServiceFromHttpClient(resultHttpClient);
});

const reminderService = createLazyService(async () => {
  const { createReminderServiceFromHttpClient } = await import(
    '@dailyuse/reminder/application-client'
  );
  return createReminderServiceFromHttpClient(resultHttpClient);
});

const repositoryService = createLazyService(async () => {
  const { createRepositoryServiceFromHttpClient } = await import(
    '@dailyuse/repository/application-client'
  );
  return createRepositoryServiceFromHttpClient(resultHttpClient);
});

const editorService = createLazyService(async () => {
  const { createEditorServiceFromHttpClient } = await import(
    '@dailyuse/editor/application-client'
  );
  return createEditorServiceFromHttpClient(resultHttpClient);
});

const scheduleService = createLazyService(async () => {
  const { createScheduleServiceFromHttpClient } = await import(
    '@dailyuse/schedule/application-client'
  );
  return createScheduleServiceFromHttpClient(resultHttpClient);
});

const settingService = createLazyService(async () => {
  const { createSettingServiceFromHttpClient } = await import(
    '@dailyuse/setting/application-client'
  );
  return createSettingServiceFromHttpClient(resultHttpClient);
});

const dataPortabilityService = createLazyService(async () => {
  const { createDataPortabilityServiceFromHttpClient } = await import(
    '@dailyuse/data-portability/application-client'
  );
  return createDataPortabilityServiceFromHttpClient(resultHttpClient);
});

const aiService = createLazyService(async () => {
  const { createAIServiceFromHttpClient } = await import(
    '@dailyuse/ai/application-client'
  );
  return createAIServiceFromHttpClient(resultHttpClient);
});

const taskService = createLazyService(async () => {
  const { createTaskServiceFromHttpClient } = await import(
    '@dailyuse/task/application-client'
  );
  return createTaskServiceFromHttpClient(resultHttpClient);
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
  app.provide(EDITOR_SERVICE_KEY, editorService);
  app.provide(SCHEDULE_SERVICE_KEY, scheduleService);
  app.provide(SETTING_SERVICE_KEY, settingService);
  app.provide(DATA_PORTABILITY_SERVICE_KEY, dataPortabilityService);
  app.provide(AI_SERVICE_KEY, aiService);
  app.provide(TASK_SERVICE_KEY, taskService);

  app.provide(DASHBOARD_SERVICE_KEY, dashboardService);
  setEditorRuntimeService(editorService);

  app.provide(MAIN_NAVIGATION_KEY, defaultMainNavigation);
  app.provide(BOTTOM_NAVIGATION_KEY, defaultBottomNavigation);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    const authStore = useAuthenticationStore();
    authStore.reset();
    window.location.replace('/auth');
  });
}
