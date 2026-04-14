/**
 * Web Platform — full app DI container.
 *
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
import { resultHttpClient } from './http';
import { createLazyService } from './lazy-service';

const authService = createLazyService(async () => {
  const [{ AuthClientService }, { createAuthHttpAdapter }] = await Promise.all([
    import('@dailyuse/authentication/application-client'),
    import('@dailyuse/authentication/infrastructure-client'),
  ]);

  return new AuthClientService(createAuthHttpAdapter(resultHttpClient));
});

const accountService = createLazyService(async () => {
  const [{ AccountClientService }, { createAccountHttpAdapter }] = await Promise.all([
    import('@dailyuse/account/application-client'),
    import('@dailyuse/account/infrastructure-client'),
  ]);

  return new AccountClientService(createAccountHttpAdapter(resultHttpClient));
});

const ruleService = createLazyService(async () => {
  const [{ GovernanceClientService }, { createRuleHttpAdapter }] = await Promise.all([
    import('@dailyuse/governance/application-client'),
    import('@dailyuse/governance/infrastructure-client'),
  ]);

  return new GovernanceClientService(createRuleHttpAdapter(resultHttpClient));
});

const goalService = createLazyService(async () => {
  const [{ GoalClientService }, { createGoalHttpAdapters }] = await Promise.all([
    import('@dailyuse/goal/application-client'),
    import('@dailyuse/goal/infrastructure-client'),
  ]);

  const goalAdapters = createGoalHttpAdapters(resultHttpClient);
  return new GoalClientService(goalAdapters.goal, goalAdapters.folder, goalAdapters.focus);
});

const notificationService = createLazyService(async () => {
  const [{ NotificationClientService }, { createNotificationHttpAdapters }] = await Promise.all([
    import('@dailyuse/notification/application-client'),
    import('@dailyuse/notification/infrastructure-client'),
  ]);

  const notificationAdapters = createNotificationHttpAdapters(resultHttpClient);
  return new NotificationClientService(notificationAdapters.notification);
});

const reminderService = createLazyService(async () => {
  const [{ ReminderClientService }, { createReminderHttpAdapters }] = await Promise.all([
    import('@dailyuse/reminder/application-client'),
    import('@dailyuse/reminder/infrastructure-client'),
  ]);

  const reminderAdapters = createReminderHttpAdapters(resultHttpClient);
  return new ReminderClientService(reminderAdapters.reminder);
});

const repositoryService = createLazyService(async () => {
  const [{ RepositoryClientService }, { createRepositoryHttpAdapters }] = await Promise.all([
    import('@dailyuse/repository/application-client'),
    import('@dailyuse/repository/infrastructure-client'),
  ]);

  const repositoryAdapters = createRepositoryHttpAdapters(resultHttpClient);
  return new RepositoryClientService(repositoryAdapters.repository);
});

const scheduleService = createLazyService(async () => {
  const [{ ScheduleClientService }, { createScheduleHttpAdapters }] = await Promise.all([
    import('@dailyuse/schedule/application-client'),
    import('@dailyuse/schedule/infrastructure-client'),
  ]);

  const scheduleAdapters = createScheduleHttpAdapters(resultHttpClient);
  return new ScheduleClientService(scheduleAdapters.event, scheduleAdapters.task);
});

const settingService = createLazyService(async () => {
  const [{ SettingClientService }, { createSettingHttpAdapters }] = await Promise.all([
    import('@dailyuse/setting/application-client'),
    import('@dailyuse/setting/infrastructure-client'),
  ]);

  const settingAdapters = createSettingHttpAdapters(resultHttpClient);
  return new SettingClientService(settingAdapters.setting);
});

const aiService = createLazyService(async () => {
  const [{ AIClientService }, { createAIHttpAdapters }] = await Promise.all([
    import('@dailyuse/ai/application-client'),
    import('@dailyuse/ai/infrastructure-client'),
  ]);

  const aiAdapters = createAIHttpAdapters(resultHttpClient);
  return new AIClientService(
    aiAdapters.capabilities,
    aiAdapters.evaluationReport,
    aiAdapters.providerConfig,
    aiAdapters.conversation,
    aiAdapters.message,
    aiAdapters.goal,
    aiAdapters.knowledge,
    aiAdapters.knowledgeNote,
    aiAdapters.analytics,
  );
});

const taskService = createLazyService(async () => {
  const [{ TaskClientService }, { createTaskHttpAdapters }] = await Promise.all([
    import('@dailyuse/task/application-client'),
    import('@dailyuse/task/infrastructure-client'),
  ]);

  const taskAdapters = createTaskHttpAdapters(resultHttpClient);
  return new TaskClientService(
    taskAdapters.template,
    taskAdapters.instance,
    taskAdapters.dependency,
  );
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
  app.provide(AI_SERVICE_KEY, aiService);
  app.provide(TASK_SERVICE_KEY, taskService);

  app.provide(DASHBOARD_SERVICE_KEY, dashboardService);

  app.provide(MAIN_NAVIGATION_KEY, defaultMainNavigation);
  app.provide(BOTTOM_NAVIGATION_KEY, defaultBottomNavigation);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    const authStore = useAuthenticationStore();
    authStore.reset();
    window.location.replace('/auth');
  });
}
