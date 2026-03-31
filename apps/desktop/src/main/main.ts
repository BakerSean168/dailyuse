/**
 * @file Electron Main Process Entry Point
 * @description
 *
 * Clean entry point — delegates all module wiring to the ElectronBootstrapper.
 * Each business module registers itself (repos, services, IPC handlers) via its
 * own `electron-entry` Composition Root, mirroring the API-side pattern.
 *
 * Responsibilities of this file:
 *   1. Initialize the PowerSync-backed business database runtime
 *   2. Bootstrap all business modules via ElectronBootstrapper
 *   3. Start ancillary services (dev tools)
 *   4. Hand off to the lifecycle manager (window creation, shutdown)
 */

import path from 'node:path';
import { app } from 'electron';
import type { IElectronModuleContext } from '@dailyuse/contracts/electron';
import { openPowerSyncLocalOnly } from './database/powersync';
import { initMemoryMonitorForDev, registerCacheIpcHandlers } from './utils';
import { registerAppLifecycleHandlers } from './lifecycle';
import { initializeEventListeners } from './events/initialize-event-listeners';
import { ElectronBootstrapper } from './bootstrap';
import { registerDashboardIpcHandler } from './ipc/dashboard-handler';

// ── Module Electron Entry Points ─────────────────────────────────────
import { GoalElectronModule } from '@dailyuse/goal/electron-entry';
import { GoalPowerSyncRepository } from '@dailyuse/goal/infrastructure-server';
import { TaskElectronModule } from '@dailyuse/task/electron-entry';
import {
  PowerSyncTaskInstanceRepository,
  PowerSyncTaskTemplateRepository,
} from '@dailyuse/task/infrastructure-server';
import { createScheduleElectronModule } from '@dailyuse/schedule/electron-entry';
import { ReminderElectronModule } from '@dailyuse/reminder/electron-entry';
import { NotificationElectronModule } from '@dailyuse/notification/electron-entry';
import { SettingElectronModule } from '@dailyuse/setting/electron-entry';
import { createAIElectronModule } from '@dailyuse/ai/electron-entry';
import { RepositoryElectronModule } from '@dailyuse/repository/electron-entry';
import { createRepositoryPowerSyncModule, FsStorageAdapter } from '@dailyuse/repository';
import { createEditorElectronModule } from '@dailyuse/editor/electron-entry';
import { AccountElectronModule } from '@dailyuse/account/electron-entry';
import { DesktopAuthElectronModule } from './modules/authentication/desktop-auth.electron-module';
import { GovernanceElectronModule } from '@dailyuse/governance/electron-entry';
import { unwrapOrThrowError } from '@dailyuse/contracts/result';
import { DesktopAnalyticsReadAdapter } from './modules/ai/desktop-analytics-read.adapter';
import { DesktopAutomationToolExecutorAdapter } from './modules/ai/desktop-automation-tool-executor.adapter';
import { DesktopKnowledgeNotePersistenceAdapter } from './modules/ai/desktop-knowledge-note-persistence.adapter';
import { DesktopKnowledgeSourceAdapter } from './modules/ai/desktop-knowledge-source.adapter';
import { configureDesktopUserDataPath } from './user-data-path';
import { configureDesktopShellIdentity } from './utils/app-icon';
import type { SearchResponse as RepositorySearchResponse } from '@dailyuse/contracts/repository';
import {
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationRepository,
  PowerSyncNotificationTemplateRepository,
} from '@dailyuse/notification/infrastructure-server';
import { CreateNotification } from '@dailyuse/notification/application-server';
import { ReminderTemplatePowerSyncRepository } from '@dailyuse/reminder/infrastructure-server';
import {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import { NotificationChannel as ReminderNotificationChannel } from '@dailyuse/contracts/reminder';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';

const configuredUserDataPath = configureDesktopUserDataPath();
configureDesktopShellIdentity();

const AIElectronModule = createAIElectronModule({
  createKnowledgeNotePersistence: (context: IElectronModuleContext) =>
    new DesktopKnowledgeNotePersistenceAdapter(context.db),
  createKnowledgeSourcePort: (context: IElectronModuleContext) =>
    new DesktopKnowledgeSourceAdapter(context.db),
  createAnalyticsReadPort: () => new DesktopAnalyticsReadAdapter(),
  createAutomationToolExecutor: (context: IElectronModuleContext) =>
    new DesktopAutomationToolExecutorAdapter(context.db),
});

type RepositorySearchItem = RepositorySearchResponse['results'][number];

/** Kept as module-level for graceful shutdown access. */
let bootstrapper: ElectronBootstrapper | null = null;
const logger = createLogger('DesktopMain');

function mapReminderChannels(channels: readonly string[]): NotificationChannelType[] {
  const resolved = new Set<NotificationChannelType>();

  if (channels.length === 0) {
    resolved.add(NotificationChannelType.InApp);
    resolved.add(NotificationChannelType.Push);
    return [...resolved];
  }

  for (const channel of channels) {
    if (channel === ReminderNotificationChannel.InApp) {
      resolved.add(NotificationChannelType.InApp);
    }
    if (channel === ReminderNotificationChannel.Push) {
      resolved.add(NotificationChannelType.Push);
    }
  }

  if (resolved.size === 0) {
    resolved.add(NotificationChannelType.InApp);
    resolved.add(NotificationChannelType.Push);
  }

  return [...resolved];
}

/**
 * Application initialisation sequence.
 */
async function initializeApp(): Promise<void> {
  const startTime = performance.now();
  console.log('[App] Initializing...');
  console.log(`[App] userData path: ${configuredUserDataPath}`);

  // 1. PowerSync-backed business database runtime
  const db = await openPowerSyncLocalOnly();
  console.log('[App] PowerSync business database initialized');

  // 2. Bootstrap business modules
  const repositoryStorageDir = path.join(app.getPath('userData'), 'repository-storage');
  const editorRepositoryModule = createRepositoryPowerSyncModule(db, {
    storagePort: new FsStorageAdapter(repositoryStorageDir),
  });
  const scheduleElectronModule = createScheduleElectronModule({
    sourceExecutor: {
      async execute(task) {
        const createNotification = new CreateNotification(
          new PowerSyncNotificationRepository(db),
          new PowerSyncNotificationTemplateRepository(db),
          new PowerSyncNotificationPreferenceRepository(db),
        );

        if (task.sourceModule === SourceModule.Reminder) {
          logger.info('[Desktop][ReminderFlow] Source executor received reminder task', {
            taskId: task.id,
            sourceEntityId: task.sourceEntityId,
            nextRunAt: task.nextRunAt?.toISOString() ?? null,
            executionCount: task.executionCount,
          });
          const reminderTemplateRepository = new ReminderTemplatePowerSyncRepository(db);
          const reminder = await reminderTemplateRepository.findById(task.sourceEntityId, {
            includeHistory: true,
          });
          if (!reminder || !reminder.isEffectivelyEnabled() || reminder.deletedAt) {
            logger.warn('[Desktop][ReminderFlow] Reminder execution skipped by source executor', {
              taskId: task.id,
              sourceEntityId: task.sourceEntityId,
              exists: !!reminder,
              effectiveEnabled: reminder?.isEffectivelyEnabled() ?? null,
              deletedAt: reminder?.deletedAt?.toISOString() ?? null,
            });
            return { nextRunAt: null, result: { skipped: true } };
          }

          logger.info('[Desktop][ReminderFlow] Recording reminder trigger', {
            reminderId: reminder.id,
            title: reminder.title,
            previousNextTriggerAt: reminder.nextTriggerAt,
          });
          reminder.recordTrigger();
          await reminderTemplateRepository.save(reminder);

          logger.info('[Desktop][ReminderFlow] Creating notification for triggered reminder', {
            reminderId: reminder.id,
            title: reminder.notificationConfig.title ?? reminder.title,
            channels: mapReminderChannels(reminder.notificationConfig.channels),
            nextTriggerAt: reminder.nextTriggerAt,
          });
          await createNotification.execute({
            identityId: String(reminder.identityId),
            title: reminder.notificationConfig.title ?? reminder.title,
            content: reminder.notificationConfig.body ?? reminder.description ?? '',
            type: NotificationType.Reminder,
            category: NotificationCategory.Reminder,
            relatedEntityType: RelatedEntityType.Reminder,
            relatedEntityId: reminder.id,
            channels: mapReminderChannels(reminder.notificationConfig.channels),
          });

          logger.info('[Desktop][ReminderFlow] Reminder execution completed', {
            reminderId: reminder.id,
            nextTriggerAt: reminder.nextTriggerAt,
          });
          return {
            nextRunAt: reminder.nextTriggerAt,
            result: {
              reminderId: reminder.id,
              reminderTitle: reminder.title,
            },
          };
        }

        if (task.sourceModule === SourceModule.Goal) {
          const goalRepository = new GoalPowerSyncRepository(db);
          const goal = await goalRepository.findById(task.sourceEntityId, {
            includeChildren: true,
          });
          if (
            !goal ||
            goal.deletedAt ||
            goal.archivedAt ||
            goal.completedAt ||
            goal.status !== 'Active' ||
            !goal.reminderConfig?.enabled
          ) {
            return { nextRunAt: null, result: { skipped: true } };
          }

          const triggerType =
            typeof task.metadata.payload['triggerType'] === 'string'
              ? task.metadata.payload['triggerType']
              : undefined;
          const triggerValue =
            typeof task.metadata.payload['triggerValue'] === 'number'
              ? task.metadata.payload['triggerValue']
              : undefined;
          const content =
            triggerType === 'RemainingDays' && triggerValue !== undefined
              ? `目标「${goal.name}」距离截止还有 ${triggerValue} 天。`
              : triggerType === 'TimeProgressPercentage' && triggerValue !== undefined
                ? `目标「${goal.name}」已达到 ${triggerValue}% 时间进度节点。`
                : (goal.description ?? `目标「${goal.name}」已到达提醒时间。`);

          await createNotification.execute({
            identityId: String(goal.identityId),
            title: `目标提醒：${goal.name}`,
            content,
            type: NotificationType.Reminder,
            category: NotificationCategory.Goal,
            relatedEntityType: RelatedEntityType.Goal,
            relatedEntityId: goal.id,
            channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
          });

          return {
            nextRunAt: null,
            result: {
              goalId: goal.id,
              goalTitle: goal.name,
              triggerType,
              triggerValue,
            },
          };
        }

        if (task.sourceModule === SourceModule.Task) {
          const taskInstanceRepository = new PowerSyncTaskInstanceRepository(db);
          const taskTemplateRepository = new PowerSyncTaskTemplateRepository(db);
          const instance = await taskInstanceRepository.findById(task.sourceEntityId);

          if (
            !instance ||
            instance.deletedAt ||
            (instance.status !== TaskInstanceStatus.Pending &&
              instance.status !== TaskInstanceStatus.InProgress)
          ) {
            return { nextRunAt: null, result: { skipped: true } };
          }

          const template = await taskTemplateRepository.findById(String(instance.templateId));
          const taskTitle =
            typeof task.metadata.payload['taskTitle'] === 'string'
              ? task.metadata.payload['taskTitle']
              : (template?.title ?? '未命名任务');
          const reminderType =
            typeof task.metadata.payload['reminderType'] === 'string'
              ? task.metadata.payload['reminderType']
              : undefined;
          const reminderValue =
            typeof task.metadata.payload['reminderValue'] === 'number'
              ? task.metadata.payload['reminderValue']
              : undefined;
          const reminderUnit =
            typeof task.metadata.payload['reminderUnit'] === 'string'
              ? task.metadata.payload['reminderUnit']
              : undefined;
          const content =
            reminderType === 'Relative' && reminderValue !== undefined && reminderUnit
              ? `任务「${taskTitle}」的提前 ${reminderValue}${reminderUnit} 提醒已到达。`
              : `任务「${taskTitle}」已到达提醒时间。`;

          await createNotification.execute({
            identityId: String(instance.identityId),
            title: `任务提醒：${taskTitle}`,
            content,
            type: NotificationType.Reminder,
            category: NotificationCategory.Task,
            relatedEntityType: RelatedEntityType.Task,
            relatedEntityId: instance.id,
            channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
          });

          return {
            nextRunAt: null,
            result: {
              instanceId: instance.id,
              templateId: String(instance.templateId),
              taskTitle,
              reminderType,
              reminderValue,
              reminderUnit,
            },
          };
        }

        throw new Error(`Unsupported schedule source module: ${task.sourceModule}`);
      },
    },
  });

  const searchRepositoryResources = async (
    repositoryId: string,
    query: string,
    caseSensitive = false,
  ): Promise<RepositorySearchResponse> => {
    const startedAt = Date.now();
    const resources =
      await editorRepositoryModule.resourceRepository.findByRepositoryId(repositoryId);
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();

    const results = resources
      .map((resource): RepositorySearchItem | null => {
        const dto = resource.toClientDTO();
        const haystacks = [dto.name, dto.path, dto.content ?? ''];
        const matches = haystacks.flatMap((value, index) => {
          const source = caseSensitive ? value : value.toLowerCase();
          const matchIndex = source.indexOf(normalizedQuery);
          if (matchIndex < 0) {
            return [];
          }

          return [
            {
              lineNumber: index + 1,
              lineContent: value,
              startIndex: matchIndex,
              endIndex: matchIndex + query.length,
            },
          ];
        });

        if (matches.length === 0) {
          return null;
        }

        return {
          resourceId: dto.id,
          resourceName: dto.name,
          resourcePath: dto.path,
          resourceType: dto.type,
          matchType: (dto.name.toLowerCase().includes(normalizedQuery.toLowerCase())
            ? 'filename'
            : 'content') as RepositorySearchItem['matchType'],
          matches,
          matchCount: matches.length,
          createdAt: new Date(dto.createdAt).toISOString(),
          updatedAt: new Date(dto.updatedAt).toISOString(),
          size: dto.size,
        };
      })
      .filter((item: RepositorySearchItem | null): item is RepositorySearchItem => item !== null);

    return {
      results,
      totalResults: results.length,
      totalMatches: results.reduce(
        (sum: number, item: RepositorySearchItem) => sum + item.matchCount,
        0,
      ),
      searchTime: Date.now() - startedAt,
      query,
      mode: 'all',
    };
  };

  bootstrapper = new ElectronBootstrapper(db);
  await bootstrapper
    // Core services
    .register(AccountElectronModule)
    .register(DesktopAuthElectronModule)
    .register(SettingElectronModule)
    .register(NotificationElectronModule)
    // Feature modules
    .register(GoalElectronModule)
    .register(TaskElectronModule)
    .register(scheduleElectronModule)
    .register(ReminderElectronModule)
    .register(AIElectronModule)
    .register(GovernanceElectronModule)
    // Repository must precede Editor (cross-module dep)
    .register(RepositoryElectronModule)
    .register(
      createEditorElectronModule({
        contentPort: {
          getContent: async (resourceId) => {
            const result = await editorRepositoryModule.api.getResource(resourceId);
            if (!result.ok || !result.data) {
              return { resourceId, name: '', content: null };
            }

            const resource = result.data as { id: string; name: string; content: string | null };
            return {
              resourceId: resource.id,
              name: resource.name,
              content: resource.content,
            };
          },
          saveContent: async ({ resourceId, content }) => {
            const result = await editorRepositoryModule.api.updateResource(resourceId, { content });
            unwrapOrThrowError(result);
          },
        },
        searchPort: {
          search: async (request) => {
            if (!request.workspaceId) {
              return { results: [], total: 0 };
            }

            const repositorySearch = await searchRepositoryResources(
              request.workspaceId,
              request.query,
            );

            return {
              results: repositorySearch.results
                .slice(request.offset ?? 0, (request.offset ?? 0) + (request.limit ?? 20))
                .map((item: RepositorySearchItem) => ({
                  resourceId: item.resourceId,
                  resourcePath: item.resourcePath,
                  resourceName: item.resourceName,
                  snippet: item.matches[0]?.lineContent ?? '',
                  score: item.matchCount,
                  highlights: item.matches.map(
                    (match: RepositorySearchItem['matches'][number]) => ({
                      line: match.lineNumber,
                      text: match.lineContent,
                    }),
                  ),
                })),
              total: repositorySearch.totalResults,
            };
          },
        },
      }),
    )
    .init();
  console.log('[App] All modules bootstrapped');

  // 3. Cross-module event listeners
  await initializeEventListeners();
  console.log('[App] Event listeners initialized');

  // 4. Ancillary
  initMemoryMonitorForDev();
  registerCacheIpcHandlers();
  registerDashboardIpcHandler();

  const initTime = performance.now() - startTime;
  console.log(`[App] Initialization complete in ${initTime.toFixed(2)}ms`);

  if (process.env.BENCHMARK_MODE === 'true') {
    console.log('[BENCHMARK] READY');
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────
registerAppLifecycleHandlers(initializeApp);

/**
 * Expose bootstrapper for graceful shutdown from lifecycle manager.
 */
export function getBootstrapper(): ElectronBootstrapper | null {
  return bootstrapper;
}
