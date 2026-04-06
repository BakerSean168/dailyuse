/**
 * Desktop Platform DI — IPC Adapter Injection
 */
import type { App } from 'vue';
import { createResultIpcClient } from '@dailyuse/ipc-client';
import { toast } from 'vue-sonner';
import { AccountClientService } from '@dailyuse/account/application-client';
import { AuthClientService } from '@dailyuse/authentication/application-client';
import { GoalClientService } from '@dailyuse/goal/application-client';
import { GovernanceClientService } from '@dailyuse/governance/application-client';
import { TaskClientService } from '@dailyuse/task/application-client';
import { ScheduleClientService } from '@dailyuse/schedule/application-client';
import { ReminderClientService } from '@dailyuse/reminder/application-client';
import { RepositoryClientService } from '@dailyuse/repository/application-client';
import { NotificationClientService } from '@dailyuse/notification/application-client';
import { SettingClientService } from '@dailyuse/setting/application-client';
import { AIClientService } from '@dailyuse/ai/application-client';
import {
  ACCOUNT_SERVICE_KEY,
  AUTH_SERVICE_KEY,
  GOAL_SERVICE_KEY,
  TASK_SERVICE_KEY,
  SCHEDULE_SERVICE_KEY,
  REMINDER_SERVICE_KEY,
  REPOSITORY_SERVICE_KEY,
  NOTIFICATION_SERVICE_KEY,
  SETTING_SERVICE_KEY,
  AI_SERVICE_KEY,
  RULE_SERVICE_KEY,
  DASHBOARD_SERVICE_KEY,
  createDashboardIpcAdapter,
  MAIN_NAVIGATION_KEY,
  BOTTOM_NAVIGATION_KEY,
  LOGOUT_HANDLER_KEY,
  defaultMainNavigation,
  defaultBottomNavigation,
  useAuthenticationStore,
} from '@dailyuse/app-vue';
import { createAccountIpcAdapters } from '@dailyuse/account/infrastructure-client';
import { createAuthIpcAdapters } from '@dailyuse/authentication/infrastructure-client';
import { createGoalIpcAdapters } from '@dailyuse/goal/infrastructure-client';
import { createTaskIpcAdapters } from '@dailyuse/task/infrastructure-client';
import { createScheduleIpcAdapters } from '@dailyuse/schedule/infrastructure-client';
import { createReminderIpcAdapters } from '@dailyuse/reminder/infrastructure-client';
import { createRepositoryIpcAdapters } from '@dailyuse/repository/infrastructure-client';
import { createNotificationIpcAdapters } from '@dailyuse/notification/infrastructure-client';
import { createSettingIpcAdapters } from '@dailyuse/setting/infrastructure-client';
import { createAIIpcAdapters } from '@dailyuse/ai/infrastructure-client';
import { createGovernanceIpcAdapters } from '@dailyuse/governance/infrastructure-client';

export function installDesktopAppServices(app: App): void {
  const resultIpcClient = createResultIpcClient();

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

  const aiAdapters = createAIIpcAdapters(resultIpcClient);
  app.provide(
    AI_SERVICE_KEY,
    new AIClientService(
      aiAdapters.capabilities,
      aiAdapters.evaluationReport,
      aiAdapters.providerConfig,
      aiAdapters.conversation,
      aiAdapters.message,
      aiAdapters.goal,
      aiAdapters.knowledge,
      aiAdapters.knowledgeNote,
      aiAdapters.analytics,
    ),
  );

  const governanceAdapters = createGovernanceIpcAdapters(resultIpcClient);
  app.provide(RULE_SERVICE_KEY, new GovernanceClientService(governanceAdapters.rule));

  app.provide(DASHBOARD_SERVICE_KEY, createDashboardIpcAdapter(resultIpcClient));
  app.provide(MAIN_NAVIGATION_KEY, defaultMainNavigation);
  app.provide(BOTTOM_NAVIGATION_KEY, defaultBottomNavigation);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    console.info('[Desktop Logout] Handler invoked');
    try {
      console.info('[Desktop Logout] Invoking auth:logout');
      const logoutResult = await window.electronAPI?.invoke('auth:logout');
      console.info('[Desktop Logout] auth:logout result', logoutResult);

      const authStore = useAuthenticationStore();
      console.info('[Desktop Logout] Resetting auth store');
      authStore.reset();

      console.info('[Desktop Logout] Invoking window:transition-to-login');
      const transitionResult = await window.electronAPI?.invoke('window:transition-to-login');
      console.info('[Desktop Logout] window:transition-to-login result', transitionResult);
    } catch (error) {
      console.error('[Desktop Logout] Failed to logout/transition', error);
      toast.error('退出登录失败', {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });
}
