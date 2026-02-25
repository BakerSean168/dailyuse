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
import { createIpcClient, createResultIpcClient } from '@dailyuse/ipc-client';

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

// ── Service Classes ──
import { AccountClientService } from '@dailyuse/account/application-client';
import { AuthClientService } from '@dailyuse/authentication/application-client';
import { GoalClientService } from '@dailyuse/goal/application-client';
import { TaskClientService } from '@dailyuse/task/application-client';
import { ScheduleClientService } from '@dailyuse/schedule/application-client';
import { ReminderClientService } from '@dailyuse/reminder/application-client';
import { RepositoryClientService } from '@dailyuse/repository/application-client';
import { NotificationClientService } from '@dailyuse/notification/application-client';
import { SettingClientService } from '@dailyuse/setting/application-client';

import { disconnectDesktopPowerSync } from './powersync';

/**
 * Vue plugin that instantiates all domain services with IPC transport
 * and provides them to the app's inject() context.
 */
export function installIpcServices(app: App): void {
  const ipcClient = createIpcClient();
  const resultIpcClient = createResultIpcClient();

  // ── Domain Services ──
  const accountAdapters = createAccountIpcAdapters(ipcClient);
  app.provide(ACCOUNT_SERVICE_KEY, new AccountClientService(accountAdapters.account));

  const authAdapters = createAuthIpcAdapters(ipcClient);
  app.provide(AUTH_SERVICE_KEY, new AuthClientService(authAdapters.auth));

  const goalAdapters = createGoalIpcAdapters(resultIpcClient);
  app.provide(
    GOAL_SERVICE_KEY,
    new GoalClientService(goalAdapters.goal, goalAdapters.folder, goalAdapters.focus),
  );

  const taskAdapters = createTaskIpcAdapters(ipcClient);
  app.provide(
    TASK_SERVICE_KEY,
    new TaskClientService(taskAdapters.template, taskAdapters.instance, taskAdapters.dependency),
  );

  const scheduleAdapters = createScheduleIpcAdapters(ipcClient);
  app.provide(
    SCHEDULE_SERVICE_KEY,
    new ScheduleClientService(scheduleAdapters.event, scheduleAdapters.task),
  );

  const reminderAdapters = createReminderIpcAdapters(ipcClient);
  app.provide(REMINDER_SERVICE_KEY, new ReminderClientService(reminderAdapters.reminder));

  const repositoryAdapters = createRepositoryIpcAdapters(ipcClient);
  app.provide(REPOSITORY_SERVICE_KEY, new RepositoryClientService(repositoryAdapters.repository));

  const notificationAdapters = createNotificationIpcAdapters(ipcClient);
  app.provide(
    NOTIFICATION_SERVICE_KEY,
    new NotificationClientService(notificationAdapters.notification),
  );

  const settingAdapters = createSettingIpcAdapters(ipcClient);
  app.provide(SETTING_SERVICE_KEY, new SettingClientService(settingAdapters.setting));

  const governanceAdapters = createGovernanceIpcAdapters(ipcClient);
  app.provide(RULE_SERVICE_KEY, governanceAdapters.rule);

  // ── UI / Navigation ──
  app.provide(MAIN_NAVIGATION_KEY, defaultMainNavigation);
  app.provide(BOTTOM_NAVIGATION_KEY, defaultBottomNavigation);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    // Disconnect PowerSync before clearing auth state
    await disconnectDesktopPowerSync();
    const authStore = useAuthenticationStore();
    authStore.reset();
    // Desktop: transition to login window via IPC
    window.electronAPI?.invoke('window:transition-to-login');
  });
}
