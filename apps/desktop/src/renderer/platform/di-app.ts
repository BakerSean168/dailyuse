/**
 * Desktop Platform DI — IPC Adapter Injection
 */
import type { App } from 'vue';
import { createResultIpcClient } from '@memoflow/ipc-client';
import { toast } from 'vue-sonner';
import { createAccountIpcClient } from '@memoflow/account/client';
import { createAuthenticationIpcClient } from '@memoflow/authentication/client';
import { createGoalIpcClient } from '@memoflow/goal/client';
import { createGovernanceIpcClient } from '@memoflow/governance/client';
import { createTaskIpcClient } from '@memoflow/task/client';
import { createScheduleIpcClient } from '@memoflow/schedule/client';
import { createReminderIpcClient } from '@memoflow/reminder/client';
import { createRepositoryIpcClient } from '@memoflow/repository/client';
import { createNotificationIpcClient } from '@memoflow/notification/client';
import { createSettingIpcClient } from '@memoflow/setting/client';
import { createAIIpcClient } from '@memoflow/ai/client';
import { createDataPortabilityIpcClient } from '@memoflow/data-portability/client';
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
  DATA_PORTABILITY_SERVICE_KEY,
  DESKTOP_AUTH_API_KEY,
  DESKTOP_BRIDGE_KEY,
  MODULE_CAPSULES_KEY,
  LOGOUT_HANDLER_KEY,
  defaultModuleCapsules,
} from '@memoflow/app-vue/di';
import { createDashboardIpcAdapter } from '@memoflow/app-vue/modules/dashboard/adapters';
import { useAuthenticationStore } from '@memoflow/app-vue/modules/authentication';
// Residual 941: host bridge via requireElectronBridge sole helper.
import { requireElectronBridge } from './electron-bridge';

export function installDesktopAppServices(app: App): void {
  const bridge = requireElectronBridge('installDesktopAppServices');

  const resultIpcClient = createResultIpcClient({ bridge });

  app.provide(ACCOUNT_SERVICE_KEY, createAccountIpcClient(resultIpcClient));

  app.provide(AUTH_SERVICE_KEY, createAuthenticationIpcClient(resultIpcClient));

  app.provide(GOAL_SERVICE_KEY, createGoalIpcClient(resultIpcClient));

  app.provide(TASK_SERVICE_KEY, createTaskIpcClient(resultIpcClient));

  app.provide(SCHEDULE_SERVICE_KEY, createScheduleIpcClient(resultIpcClient));

  app.provide(REMINDER_SERVICE_KEY, createReminderIpcClient(resultIpcClient));

  app.provide(REPOSITORY_SERVICE_KEY, createRepositoryIpcClient(resultIpcClient));

  app.provide(NOTIFICATION_SERVICE_KEY, createNotificationIpcClient(resultIpcClient));

  app.provide(SETTING_SERVICE_KEY, createSettingIpcClient(resultIpcClient));

  app.provide(AI_SERVICE_KEY, createAIIpcClient(resultIpcClient));

  app.provide(RULE_SERVICE_KEY, createGovernanceIpcClient(resultIpcClient));

  app.provide(DATA_PORTABILITY_SERVICE_KEY, createDataPortabilityIpcClient(resultIpcClient));

  app.provide(DASHBOARD_SERVICE_KEY, createDashboardIpcAdapter(resultIpcClient));
  // V2 shell capsule navigation (UI_REDESIGN_V2_PLAN §2.2 / Brief §12-4)
  app.provide(MODULE_CAPSULES_KEY, defaultModuleCapsules);

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
