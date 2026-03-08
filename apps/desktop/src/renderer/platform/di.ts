/**
 * Desktop Platform DI — IPC Adapter Injection
 *
 * Creates IPC-backed service instances and provides them via Vue DI,
 * mirroring the web app's installWebServices but using IPC transport
 * instead of HTTP.
 *
 * Pattern: ipcClient → create*IpcAdapters(ipcClient) → new *ClientService(adapters) → app.provide(KEY, service)
 */
import type { App } from 'vue';
import { createResultIpcClient } from '@dailyuse/ipc-client';
import { AccountClientService } from '@dailyuse/account/application-client';
import { AuthClientService } from '@dailyuse/authentication/application-client';
import { GoalClientService } from '@dailyuse/goal/application-client';
import { TaskClientService } from '@dailyuse/task/application-client';
import { ScheduleClientService } from '@dailyuse/schedule/application-client';
import { ReminderClientService } from '@dailyuse/reminder/application-client';
import { RepositoryClientService } from '@dailyuse/repository/application-client';
import { NotificationClientService } from '@dailyuse/notification/application-client';
import { SettingClientService } from '@dailyuse/setting/application-client';

import {
  // Domain service keys
  ACCOUNT_SERVICE_KEY,
  AUTH_SERVICE_KEY,
  GOAL_SERVICE_KEY,
  TASK_SERVICE_KEY,
  SCHEDULE_SERVICE_KEY,
  REMINDER_SERVICE_KEY,
  REPOSITORY_SERVICE_KEY,
  NOTIFICATION_SERVICE_KEY,
  SETTING_SERVICE_KEY,
  RULE_SERVICE_KEY,
  DASHBOARD_SERVICE_KEY,
  createDashboardIpcAdapter,
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

// ── Adapter Factories ──
import { createAccountIpcAdapters } from '@dailyuse/account/infrastructure-client';
import { createAuthIpcAdapters } from '@dailyuse/authentication/infrastructure-client';
import { createGoalIpcAdapters } from '@dailyuse/goal/infrastructure-client';
import { createTaskIpcAdapters } from '@dailyuse/task/infrastructure-client';
import { createScheduleIpcAdapters } from '@dailyuse/schedule/infrastructure-client';
import { createReminderIpcAdapters } from '@dailyuse/reminder/infrastructure-client';
import { createRepositoryIpcAdapters } from '@dailyuse/repository/infrastructure-client';
import { createNotificationIpcAdapters } from '@dailyuse/notification/infrastructure-client';
import { createSettingIpcAdapters } from '@dailyuse/setting/infrastructure-client';
import { createGovernanceIpcAdapters } from '@dailyuse/governance/infrastructure-client';

/**
 * Vue plugin that instantiates all domain services with IPC transport
 * and provides them to the app's inject() context.
 */
export function installIpcServices(app: App): void {
  const resultIpcClient = createResultIpcClient();

  // ── Domain Services ──
  const accountAdapters = createAccountIpcAdapters(resultIpcClient);
  app.provide(ACCOUNT_SERVICE_KEY, new AccountClientService(accountAdapters.account));

  const authAdapters = createAuthIpcAdapters(resultIpcClient);
  app.provide(AUTH_SERVICE_KEY, new AuthClientService(authAdapters.auth));

  const goalAdapters = createGoalIpcAdapters(resultIpcClient);
  app.provide(
    GOAL_SERVICE_KEY,
    new GoalClientService(goalAdapters.goal, goalAdapters.folder, goalAdapters.focus),
  );

  const taskAdapters = createTaskIpcAdapters(resultIpcClient);
  app.provide(
    TASK_SERVICE_KEY,
    new TaskClientService(taskAdapters.template, taskAdapters.instance, taskAdapters.dependency),
  );

  const scheduleAdapters = createScheduleIpcAdapters(resultIpcClient);
  app.provide(
    SCHEDULE_SERVICE_KEY,
    new ScheduleClientService(scheduleAdapters.event, scheduleAdapters.task),
  );

  const reminderAdapters = createReminderIpcAdapters(resultIpcClient);
  app.provide(REMINDER_SERVICE_KEY, new ReminderClientService(reminderAdapters.reminder));

  const repositoryAdapters = createRepositoryIpcAdapters(resultIpcClient);
  app.provide(REPOSITORY_SERVICE_KEY, new RepositoryClientService(repositoryAdapters.repository));

  const notificationAdapters = createNotificationIpcAdapters(resultIpcClient);
  app.provide(
    NOTIFICATION_SERVICE_KEY,
    new NotificationClientService(notificationAdapters.notification),
  );

  const settingAdapters = createSettingIpcAdapters(resultIpcClient);
  app.provide(SETTING_SERVICE_KEY, new SettingClientService(settingAdapters.setting));

  const governanceAdapters = createGovernanceIpcAdapters(resultIpcClient);
  app.provide(RULE_SERVICE_KEY, governanceAdapters.rule);

  // ── Dashboard ──
  app.provide(DASHBOARD_SERVICE_KEY, createDashboardIpcAdapter(resultIpcClient));

  // ── UI / Navigation ──
  app.provide(MAIN_NAVIGATION_KEY, defaultMainNavigation);
  app.provide(BOTTOM_NAVIGATION_KEY, defaultBottomNavigation);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    const authStore = useAuthenticationStore();
    authStore.reset();
    // Desktop: transition to login window via IPC
    window.electronAPI?.invoke('window:transition-to-login');
  });
}
