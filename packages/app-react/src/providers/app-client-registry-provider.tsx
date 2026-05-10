import {
  createContext,
  type PropsWithChildren,
  useContext,
  useRef,
} from 'react';

import type { AccountClientService } from '@dailyuse/account/application-client';
import { createAccountServiceFromHttpClient } from '@dailyuse/account/application-client';
import type { AIClientService } from '@dailyuse/ai/application-client';
import { createAIServiceFromHttpClient } from '@dailyuse/ai/application-client';
import type { GoalClientService } from '@dailyuse/goal/application-client';
import { createGoalServiceFromHttpClient } from '@dailyuse/goal/application-client';
import type { NotificationClientService } from '@dailyuse/notification/application-client';
import { createNotificationServiceFromHttpClient } from '@dailyuse/notification/application-client';
import type { ReminderClientService } from '@dailyuse/reminder/application-client';
import { createReminderServiceFromHttpClient } from '@dailyuse/reminder/application-client';
import type { RepositoryClientService } from '@dailyuse/repository/application-client';
import { createRepositoryServiceFromHttpClient } from '@dailyuse/repository/application-client';
import type { ScheduleClientService } from '@dailyuse/schedule/application-client';
import { createScheduleServiceFromHttpClient } from '@dailyuse/schedule/application-client';
import type { SettingClientService } from '@dailyuse/setting/application-client';
import { createSettingServiceFromHttpClient } from '@dailyuse/setting/application-client';
import type { TaskClientService } from '@dailyuse/task/application-client';
import { createTaskServiceFromHttpClient } from '@dailyuse/task/application-client';
import type { IResultHttpClient } from '@dailyuse/http-client';

import { useAppSession } from './app-session-provider';

export type AppClientRegistry = {
  httpClient: IResultHttpClient;
  accountService: AccountClientService;
  aiService: AIClientService;
  goalService: GoalClientService;
  notificationService: NotificationClientService;
  reminderService: ReminderClientService;
  repositoryService: RepositoryClientService;
  scheduleService: ScheduleClientService;
  settingService: SettingClientService;
  taskService: TaskClientService;
};

const AppClientRegistryContext = createContext<AppClientRegistry | null>(null);

export function createAppClientRegistry(httpClient: IResultHttpClient): AppClientRegistry {
  return {
    httpClient,
    accountService: createAccountServiceFromHttpClient(httpClient),
    aiService: createAIServiceFromHttpClient(httpClient),
    goalService: createGoalServiceFromHttpClient(httpClient),
    notificationService: createNotificationServiceFromHttpClient(httpClient),
    reminderService: createReminderServiceFromHttpClient(httpClient),
    repositoryService: createRepositoryServiceFromHttpClient(httpClient),
    scheduleService: createScheduleServiceFromHttpClient(httpClient),
    settingService: createSettingServiceFromHttpClient(httpClient),
    taskService: createTaskServiceFromHttpClient(httpClient),
  };
}

export function AppClientRegistryProvider({ children }: PropsWithChildren) {
  const { createAuthorizedHttpClient } = useAppSession();
  const registryRef = useRef<AppClientRegistry | null>(null);

  if (!registryRef.current) {
    registryRef.current = createAppClientRegistry(createAuthorizedHttpClient());
  }

  return (
    <AppClientRegistryContext.Provider value={registryRef.current}>
      {children}
    </AppClientRegistryContext.Provider>
  );
}

export function useAppClientRegistry() {
  const context = useContext(AppClientRegistryContext);

  if (!context) {
    throw new Error('useAppClientRegistry must be used inside AppClientRegistryProvider.');
  }

  return context;
}
