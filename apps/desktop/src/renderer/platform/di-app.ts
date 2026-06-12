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
import { EditorClientService } from '@dailyuse/editor/application-client';
import { NotificationClientService } from '@dailyuse/notification/application-client';
import { SettingClientService } from '@dailyuse/setting/application-client';
import { AIClientService } from '@dailyuse/ai/application-client';
import { DataPortabilityClientService } from '@dailyuse/data-portability/application-client';
import {
  ACCOUNT_SERVICE_KEY,
  AUTH_SERVICE_KEY,
  GOAL_SERVICE_KEY,
  TASK_SERVICE_KEY,
  SCHEDULE_SERVICE_KEY,
  REMINDER_SERVICE_KEY,
  REPOSITORY_SERVICE_KEY,
  EDITOR_SERVICE_KEY,
  NOTIFICATION_SERVICE_KEY,
  SETTING_SERVICE_KEY,
  AI_SERVICE_KEY,
  RULE_SERVICE_KEY,
  DASHBOARD_SERVICE_KEY,
  DATA_PORTABILITY_SERVICE_KEY,
  DESKTOP_AUTH_API_KEY,
  DESKTOP_BRIDGE_KEY,
  MAIN_NAVIGATION_KEY,
  BOTTOM_NAVIGATION_KEY,
  LOGOUT_HANDLER_KEY,
  defaultMainNavigation,
  defaultBottomNavigation,
} from '@dailyuse/app-vue/di';
import { createDashboardIpcAdapter } from '@dailyuse/app-vue/modules/dashboard/adapters';
import { useAuthenticationStore } from '@dailyuse/app-vue/modules/authentication';
import { setEditorRuntimeService } from '@dailyuse/app-vue/modules/editor';
import { createAccountIpcAdapters } from '@dailyuse/account/infrastructure-client';
import { createAuthIpcAdapters } from '@dailyuse/authentication/infrastructure-client';
import { createGoalIpcAdapters } from '@dailyuse/goal/infrastructure-client';
import { createTaskIpcAdapters } from '@dailyuse/task/infrastructure-client';
import { createScheduleIpcAdapters } from '@dailyuse/schedule/infrastructure-client';
import { createReminderIpcAdapters } from '@dailyuse/reminder/infrastructure-client';
import { createRepositoryIpcAdapters } from '@dailyuse/repository/infrastructure-client';
import { createEditorIpcAdapters } from '@dailyuse/editor/infrastructure-client';
import { createNotificationIpcAdapters } from '@dailyuse/notification/infrastructure-client';
import { createSettingIpcAdapters } from '@dailyuse/setting/infrastructure-client';
import { createAIIpcAdapters } from '@dailyuse/ai/infrastructure-client';
import { createGovernanceIpcAdapters } from '@dailyuse/governance/infrastructure-client';
import { DataPortabilityIpcAdapter } from '@dailyuse/data-portability/infrastructure-client';

export function installDesktopAppServices(app: App): void {
  const bridge = window.electronAPI;
  if (!bridge) {
    throw new Error('installDesktopAppServices requires window.electronAPI (preload bridge)');
  }

  const resultIpcClient = createResultIpcClient({ bridge });

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

  const editorAdapters = createEditorIpcAdapters(resultIpcClient);
  const editorService = new EditorClientService(editorAdapters.editor);
  app.provide(EDITOR_SERVICE_KEY, editorService);
  setEditorRuntimeService(editorService);

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
      aiAdapters.agentRuntime,
    ),
  );

  const governanceAdapters = createGovernanceIpcAdapters(resultIpcClient);
  app.provide(RULE_SERVICE_KEY, new GovernanceClientService(governanceAdapters.rule));

  const dataPortabilityAdapter = new DataPortabilityIpcAdapter(resultIpcClient);
  app.provide(DATA_PORTABILITY_SERVICE_KEY, new DataPortabilityClientService(dataPortabilityAdapter));

  app.provide(DASHBOARD_SERVICE_KEY, createDashboardIpcAdapter(resultIpcClient));
  app.provide(MAIN_NAVIGATION_KEY, defaultMainNavigation);
  app.provide(BOTTOM_NAVIGATION_KEY, defaultBottomNavigation);

  // Provide desktop auth API for automatic auth recovery in composables
  app.provide(DESKTOP_AUTH_API_KEY, bridge);
  app.provide(DESKTOP_BRIDGE_KEY, bridge);
  app.provide(LOGOUT_HANDLER_KEY, async () => {
    console.info('[Desktop Logout] Handler invoked');
    try {
      console.info('[Desktop Logout] Invoking auth:logout');
      const logoutResult = await bridge.invoke('auth:logout');
      console.info('[Desktop Logout] auth:logout result', logoutResult);

      const authStore = useAuthenticationStore();
      console.info('[Desktop Logout] Resetting auth store');
      authStore.reset();
    } catch (error) {
      console.error('[Desktop Logout] Failed to logout/transition', error);
      toast.error('退出登录失败', {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });
}
