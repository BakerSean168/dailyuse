import {
  createContext,
  type PropsWithChildren,
  useContext,
  useRef,
} from 'react';

import type { AccountClientPort } from '@dailyuse/account/client';
import { createAccountHttpClient } from '@dailyuse/account/client';
import type { AIClientPort } from '@dailyuse/ai/client';
import { createAIHttpClient } from '@dailyuse/ai/client';
import type { GoalClientPort } from '@dailyuse/goal/client';
import { createGoalHttpClient } from '@dailyuse/goal/client';
import type { NotificationClientPort } from '@dailyuse/notification/client';
import { createNotificationHttpClient } from '@dailyuse/notification/client';
import type { ReminderClientPort } from '@dailyuse/reminder/client';
import { createReminderHttpClient } from '@dailyuse/reminder/client';
import type { RepositoryClientPort } from '@dailyuse/repository/client';
import { createRepositoryHttpClient } from '@dailyuse/repository/client';
import type { ScheduleClientPort } from '@dailyuse/schedule/client';
import { createScheduleHttpClient } from '@dailyuse/schedule/client';
import type { SettingClientPort } from '@dailyuse/setting/client';
import { createSettingHttpClient } from '@dailyuse/setting/client';
import type { TaskClientPort } from '@dailyuse/task/client';
import { createTaskHttpClient } from '@dailyuse/task/client';
import type { IResultHttpClient } from '@dailyuse/http-client';

import { useAppSession } from './app-session-provider';

export type AppClientRegistry = {
  httpClient: IResultHttpClient;
  accountService: AccountClientPort;
  aiService: AIClientPort;
  goalService: GoalClientPort;
  notificationService: NotificationClientPort;
  reminderService: ReminderClientPort;
  repositoryService: RepositoryClientPort;
  scheduleService: ScheduleClientPort;
  settingService: SettingClientPort;
  taskService: TaskClientPort;
};

const AppClientRegistryContext = createContext<AppClientRegistry | null>(null);

export function createAppClientRegistry(httpClient: IResultHttpClient): AppClientRegistry {
  return {
    httpClient,
    accountService: createAccountHttpClient(httpClient),
    aiService: createAIHttpClient(httpClient),
    goalService: createGoalHttpClient(httpClient),
    notificationService: createNotificationHttpClient(httpClient),
    reminderService: createReminderHttpClient(httpClient),
    repositoryService: createRepositoryHttpClient(httpClient),
    scheduleService: createScheduleHttpClient(httpClient),
    settingService: createSettingHttpClient(httpClient),
    taskService: createTaskHttpClient(httpClient),
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
