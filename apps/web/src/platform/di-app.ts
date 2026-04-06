/**
 * Web Platform — full app DI container.
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
  createDashboardHttpAdapter,
  MAIN_NAVIGATION_KEY,
  BOTTOM_NAVIGATION_KEY,
  LOGOUT_HANDLER_KEY,
  defaultMainNavigation,
  defaultBottomNavigation,
  useAuthenticationStore,
} from '@dailyuse/app-vue';

import { AccountClientService } from '@dailyuse/account/application-client';
import { createAccountHttpAdapter } from '@dailyuse/account/infrastructure-client';
import { AuthClientService } from '@dailyuse/authentication/application-client';
import { createAuthHttpAdapter } from '@dailyuse/authentication/infrastructure-client';
import { GovernanceClientService } from '@dailyuse/governance/application-client';
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
import { AIClientService } from '@dailyuse/ai/application-client';
import { createAIHttpAdapters } from '@dailyuse/ai/infrastructure-client';

import { resultHttpClient } from './http';

const authService = new AuthClientService(createAuthHttpAdapter(resultHttpClient));
const accountService = new AccountClientService(createAccountHttpAdapter(resultHttpClient));
const ruleService = new GovernanceClientService(createRuleHttpAdapter(resultHttpClient));

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

const aiAdapters = createAIHttpAdapters(resultHttpClient);
const aiService = new AIClientService(
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

const taskAdapters = createTaskHttpAdapters(resultHttpClient);
const taskService = new TaskClientService(
  taskAdapters.template,
  taskAdapters.instance,
  taskAdapters.dependency,
);

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

  app.provide(DASHBOARD_SERVICE_KEY, createDashboardHttpAdapter(resultHttpClient));

  app.provide(MAIN_NAVIGATION_KEY, defaultMainNavigation);
  app.provide(BOTTOM_NAVIGATION_KEY, defaultBottomNavigation);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    const authStore = useAuthenticationStore();
    authStore.reset();
    window.location.replace('/auth');
  });
}
