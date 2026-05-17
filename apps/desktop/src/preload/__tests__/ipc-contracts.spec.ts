import { describe, expect, it, vi } from 'vitest';
import {
  AccountChannels,
  AIChannels,
  AuthChannels,
  DashboardChannels,
  DesktopFeatureChannels,
  EditorChannels,
  GoalChannels,
  GovernanceChannels,
  NotificationChannels,
  ReminderChannels,
  RepositoryChannels,
  ScheduleChannels,
  SettingChannels,
  SystemChannels,
  TaskChannels,
  WindowChannels,
} from '../../shared/types/ipc-channels';
import { ALLOWED_CHANNELS } from '../allowed-channels';
import { AccountIpcAdapter } from '@dailyuse/account/infrastructure-client';
import { AuthIpcAdapter } from '@dailyuse/authentication/infrastructure-client';
import {
  AIConversationIpcAdapter,
  AIMessageIpcAdapter,
  AIProviderConfigIpcAdapter,
} from '@dailyuse/ai/infrastructure-client';
import { AIGoalIpcAdapter } from '../../../../../packages/ai/src/infrastructure-client/adapters/ipc/ai-goal-ipc.adapter';
import { AIKnowledgeNoteIpcAdapter } from '../../../../../packages/ai/src/infrastructure-client/adapters/ipc/ai-knowledge-note-ipc.adapter';
import { RuleIpcAdapter } from '@dailyuse/governance/infrastructure-client';
import { NotificationIpcAdapter } from '@dailyuse/notification/infrastructure-client';
import { TaskTemplateIpcAdapter } from '@dailyuse/task/infrastructure-client';
import {
  ScheduleEventIpcAdapter,
  ScheduleTaskIpcAdapter,
} from '@dailyuse/schedule/infrastructure-client';
import { ReminderIpcAdapter } from '@dailyuse/reminder/infrastructure-client';
import { RepositoryIpcAdapter } from '@dailyuse/repository/infrastructure-client';
import { SettingIpcAdapter } from '@dailyuse/setting/infrastructure-client';

function channelSet(values: Record<string, string>) {
  return new Set<string>(Object.values(values) as string[]);
}

function allowedByPrefix(prefix: string) {
  return new Set<string>(ALLOWED_CHANNELS.filter((channel) => String(channel).startsWith(prefix)));
}

function aiChannelSet() {
  return new Set<string>([
    ...Object.values(AIChannels),
    'ai:chat:message:stream:chunk',
    'ai:chat:message:stream:done',
    'ai:chat:message:stream:error',
  ]);
}

function expectChannelsRegistered(channels: string[], registered: Set<string>) {
  for (const channel of channels) {
    expect(registered.has(channel)).toBe(true);
  }
}

function createIpcRecorder(
  resolver?: (channel: string, args: unknown[]) => { ok: boolean; data: unknown; error?: unknown },
) {
  const invoke = vi
    .fn()
    .mockImplementation((channel: string, ...args: unknown[]) =>
      Promise.resolve(resolver?.(channel, args) ?? { ok: true, data: null }),
    );
  return {
    invoke,
    channels: () => invoke.mock.calls.map(([channel]) => channel as string),
  };
}

describe('desktop IPC contract alignment', () => {
  it('keeps shared task channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('task:')).toEqual(channelSet(TaskChannels));
  });

  it('keeps shared goal channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('goal:')).toEqual(channelSet(GoalChannels));
  });

  it('allows goal focus mode channels through preload allowlist', () => {
    expect(ALLOWED_CHANNELS).toContain('goal:focus-mode:get');
    expect(ALLOWED_CHANNELS).toContain('goal:focus-mode:activate');
    expect(ALLOWED_CHANNELS).toContain('goal:focus-mode:deactivate');
    expect(ALLOWED_CHANNELS).toContain('goal:focus-mode:extend');
  });

  it('keeps shared system channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('system:')).toEqual(channelSet(SystemChannels));
  });

  it('keeps shared dashboard channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('dashboard:')).toEqual(channelSet(DashboardChannels));
  });

  it('keeps shared desktop feature channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('desktop:')).toEqual(channelSet(DesktopFeatureChannels));
  });

  it('keeps shared account channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('account:')).toEqual(channelSet(AccountChannels));
  });

  it('keeps shared auth channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('auth:')).toEqual(channelSet(AuthChannels));
  });

  it('keeps shared schedule channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('schedule:')).toEqual(channelSet(ScheduleChannels));
  });

  it('keeps shared reminder channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('reminder:')).toEqual(channelSet(ReminderChannels));
  });

  it('keeps shared repository channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('repository:')).toEqual(channelSet(RepositoryChannels));
  });

  it('keeps shared editor channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('editor:')).toEqual(channelSet(EditorChannels));
  });

  it('keeps shared governance channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('governance:')).toEqual(channelSet(GovernanceChannels));
  });

  it('keeps shared ai channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('ai:')).toEqual(aiChannelSet());
  });

  it('keeps shared window channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('window:')).toEqual(channelSet(WindowChannels));
  });

  it('keeps supported notification channels aligned with preload allowlist', () => {
    const supported = new Set([
      NotificationChannels.LIST,
      NotificationChannels.GET,
      NotificationChannels.CREATE,
      NotificationChannels.MARK_READ,
      NotificationChannels.MARK_ALL_READ,
      NotificationChannels.DELETE,
      NotificationChannels.CLEAR_ALL,
      NotificationChannels.GET_UNREAD_COUNT,
      NotificationChannels.CUSTOM_RECEIVE,
      NotificationChannels.CUSTOM_CLICK,
      NotificationChannels.CUSTOM_CLOSE,
      NotificationChannels.CUSTOM_RESIZE,
      NotificationChannels.CUSTOM_MOUSE_ENTER,
      NotificationChannels.CUSTOM_MOUSE_LEAVE,
      NotificationChannels.CUSTOM_RENDERER_READY,
    ]);
    expectChannelsRegistered([...supported], allowedByPrefix('notification:'));
  });

  it('keeps supported setting channels aligned with preload allowlist', () => {
    const supported = new Set([
      SettingChannels.GET_ALL,
      SettingChannels.PATCH,
      SettingChannels.RESET,
      SettingChannels.IMPORT,
      SettingChannels.EXPORT,
    ]);
    expectChannelsRegistered([...supported], allowedByPrefix('setting:'));
  });

  it('task adapters only invoke registered desktop task channels', async () => {
    const recorder = createIpcRecorder();
    const templateAdapter = new TaskTemplateIpcAdapter(recorder as never);

    await templateAdapter.createTaskTemplate({} as never);
    await templateAdapter.getTaskTemplates();
    await templateAdapter.getTaskTemplateById('task-template-1');
    await templateAdapter.updateTaskTemplate('task-template-1', {} as never);
    await templateAdapter.deleteTaskTemplate('task-template-1');
    await templateAdapter.getTasksWithPrioritySorting({ limit: 5 });
    await templateAdapter.activateTaskTemplate('task-template-1');
    await templateAdapter.pauseTaskTemplate('task-template-1');
    await templateAdapter.archiveTaskTemplate('task-template-1');
    await templateAdapter.generateInstances('task-template-1', {} as never);
    await templateAdapter.getInstancesByDateRange('task-template-1', 1, 2);
    await templateAdapter.bindToGoal('task-template-1', {} as never);
    await templateAdapter.unbindFromGoal('task-template-1');

    expect(new Set(recorder.channels())).toEqual(
      new Set([
        TaskChannels.TEMPLATE_CREATE,
        TaskChannels.TEMPLATE_LIST,
        TaskChannels.TEMPLATE_GET,
        TaskChannels.TEMPLATE_UPDATE,
        TaskChannels.TEMPLATE_DELETE,
        TaskChannels.TEMPLATE_GET_BY_PRIORITY,
        TaskChannels.TEMPLATE_RESTORE,
        TaskChannels.TEMPLATE_PAUSE,
        TaskChannels.TEMPLATE_ARCHIVE,
        TaskChannels.TEMPLATE_GENERATE_INSTANCES,
        TaskChannels.TEMPLATE_GET_INSTANCES,
        TaskChannels.TEMPLATE_BIND_GOAL,
        TaskChannels.TEMPLATE_UNBIND_GOAL,
      ]),
    );
  });

  it('account adapter only invokes registered desktop account channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = new AccountIpcAdapter(recorder as never);

    await adapter.getMyProfile();
    await adapter.updateMyProfile({} as never);
    await adapter.checkAvailability({} as never);
    await adapter.closeAccount({} as never);

    expectChannelsRegistered(recorder.channels(), channelSet(AccountChannels));
  });

  it('auth adapter only invokes registered desktop auth channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = new AuthIpcAdapter(recorder as never);

    await adapter.loginByEmail({} as never);
    await adapter.loginByPhone({} as never);
    await adapter.registerByEmail({} as never);
    await adapter.registerByPhone({} as never);
    await adapter.sendSmsCode({} as never);
    await adapter.refreshToken({} as never);
    await adapter.logout();
    await adapter.getCurrentUser();
    await adapter.listSessions();
    await adapter.revokeSession({} as never);
    await adapter.changePassword({} as never);
    await adapter.forgotPassword({} as never);
    await adapter.resetPassword({} as never);
    await adapter.enterGuestMode();
    await adapter.autoLoginDesktop();
    await adapter.listRememberedAccounts();
    await adapter.loginRememberedDesktopAccount({ identityId: 'identity-1' } as never);
    await adapter.removeRememberedAccount('identity-1');

    expectChannelsRegistered(recorder.channels(), channelSet(AuthChannels));
  });

  it('schedule adapters only invoke registered desktop schedule channels', async () => {
    const recorder = createIpcRecorder();
    const eventAdapter = new ScheduleEventIpcAdapter(recorder as never);
    const taskAdapter = new ScheduleTaskIpcAdapter(recorder as never);

    await eventAdapter.createSchedule({} as never);
    await eventAdapter.getSchedule('schedule-1');
    await eventAdapter.getSchedulesByAccount();
    await eventAdapter.getSchedulesByTimeRange({} as never);
    await eventAdapter.updateSchedule('schedule-1', {} as never);
    await eventAdapter.deleteSchedule('schedule-1');
    await eventAdapter.getScheduleConflicts('schedule-1');
    await eventAdapter.detectConflicts({ startTime: 1, endTime: 2 });
    await eventAdapter.createScheduleWithConflictDetection({} as never);
    await eventAdapter.resolveConflict('schedule-1', {} as never);

    await taskAdapter.createTask({} as never);
    await taskAdapter.createTasksBatch([{} as never]);
    await taskAdapter.getTasks();
    await taskAdapter.getTaskById('schedule-task-1');
    await taskAdapter.getDueTasks({ limit: 5 });
    await taskAdapter.getTaskBySource('Goal' as never, 'source-1');
    await taskAdapter.pauseTask('schedule-task-1');
    await taskAdapter.resumeTask('schedule-task-1');
    await taskAdapter.completeTask('schedule-task-1', 'done');
    await taskAdapter.cancelTask('schedule-task-1', 'cancelled');
    await taskAdapter.deleteTask('schedule-task-1');
    await taskAdapter.deleteTasksBatch(['schedule-task-1']);
    await taskAdapter.updateTaskMetadata('schedule-task-1', {});

    expect(new Set(recorder.channels())).toEqual(
      new Set([
        ScheduleChannels.CREATE,
        ScheduleChannels.GET,
        ScheduleChannels.LIST,
        ScheduleChannels.LIST_BY_DATE_RANGE,
        ScheduleChannels.UPDATE,
        ScheduleChannels.DELETE,
        ScheduleChannels.GET_CONFLICTS,
        ScheduleChannels.DETECT_CONFLICTS,
        ScheduleChannels.CREATE_WITH_CONFLICT_DETECTION,
        ScheduleChannels.RESOLVE_CONFLICT,
        ScheduleChannels.TASK_CREATE,
        ScheduleChannels.TASK_CREATE_BATCH,
        ScheduleChannels.TASK_LIST,
        ScheduleChannels.TASK_GET_BY_ID,
        ScheduleChannels.TASK_GET_DUE,
        ScheduleChannels.TASK_GET_BY_SOURCE,
        ScheduleChannels.TASK_PAUSE,
        ScheduleChannels.TASK_RESUME,
        ScheduleChannels.TASK_COMPLETE,
        ScheduleChannels.TASK_CANCEL,
        ScheduleChannels.TASK_DELETE,
        ScheduleChannels.TASK_DELETE_BATCH,
        ScheduleChannels.TASK_UPDATE_METADATA,
      ]),
    );
  });

  it('reminder adapter only invokes registered desktop reminder channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = new ReminderIpcAdapter(recorder as never);

    await adapter.createReminderTemplate({} as never);
    await adapter.getReminderTemplate('reminder-template-1');
    await adapter.getReminderTemplates();
    await adapter.getUserTemplates();
    await adapter.updateReminderTemplate('reminder-template-1', {} as never);
    await adapter.deleteReminderTemplate('reminder-template-1');
    await adapter.toggleTemplateEnabled('reminder-template-1');
    await adapter.moveTemplateToGroup('reminder-template-1', 'reminder-group-1');
    await adapter.getUpcomingReminders({ days: 7 });
    await adapter.getTodaySchedule({ limit: 5, includeExpired: false });
    await adapter.createReminderGroup({} as never);
    await adapter.getReminderGroup('reminder-group-1');
    await adapter.getReminderGroups();
    await adapter.getUserReminderGroups();
    await adapter.updateReminderGroup('reminder-group-1', {} as never);
    await adapter.deleteReminderGroup('reminder-group-1');
    await adapter.toggleReminderGroupStatus('reminder-group-1');
    await adapter.switchReminderGroupControlMode('reminder-group-1', 'manual' as never);
    await adapter.getPreferences();
    await adapter.updatePreferences({});

    expect(new Set(recorder.channels())).toEqual(channelSet(ReminderChannels));
  });

  it('notification adapter only invokes registered desktop notification channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = new NotificationIpcAdapter(recorder as never);

    await adapter.createNotification({} as never);
    await adapter.findNotifications({} as never);
    await adapter.findNotificationById('notification-1');
    await adapter.markAsRead('notification-1');
    await adapter.markAllAsRead();
    await adapter.deleteNotification('notification-1');
    await adapter.batchDeleteNotifications(['notification-1']);
    await adapter.getUnreadCount();

    const supported = new Set([
      NotificationChannels.CREATE,
      NotificationChannels.LIST,
      NotificationChannels.GET,
      NotificationChannels.MARK_READ,
      NotificationChannels.MARK_ALL_READ,
      NotificationChannels.DELETE,
      NotificationChannels.CLEAR_ALL,
      NotificationChannels.GET_UNREAD_COUNT,
    ]);
    expectChannelsRegistered(recorder.channels(), supported);
    expectChannelsRegistered(recorder.channels(), allowedByPrefix('notification:'));
  });

  it('setting adapter only invokes registered desktop setting channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = new SettingIpcAdapter(recorder as never);

    await adapter.getUserSettings();
    await adapter.patchCategory('appearance' as never, {});
    await adapter.resetUserSettings();
    await adapter.exportSettings();
    await adapter.importSettings('{}');

    const supported = new Set([
      SettingChannels.GET_ALL,
      SettingChannels.PATCH,
      SettingChannels.RESET,
      SettingChannels.EXPORT,
      SettingChannels.IMPORT,
    ]);
    expectChannelsRegistered(recorder.channels(), supported);
    expectChannelsRegistered(recorder.channels(), allowedByPrefix('setting:'));
  });

  it('repository adapter only invokes registered desktop repository channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = new RepositoryIpcAdapter(recorder as never);

    await adapter.getCurrentRepository();
    await adapter.createFolder({} as never);
    await adapter.getFolderContents('folder-1');
    await adapter.renameFolder('folder-1', 'Renamed');
    await adapter.moveFolder('folder-1', 'parent-1');
    await adapter.deleteFolder('folder-1');
    await adapter.getFileTree('repository-1');
    await adapter.search({ query: 'abc', repositoryId: 'repository-1' } as never);
    await adapter.listResources('repository-1');
    await adapter.createResource('repository-1', {} as never);
    await adapter.getResource('resource-1');
    await adapter.updateResource('resource-1', {} as never);
    await adapter.renameResource('resource-1', 'Renamed');
    await adapter.moveResource('resource-1', 'folder-1');
    await adapter.deleteResource('resource-1');
    await adapter.uploadResources('repository-1', { files: [] } as never);
    await adapter.listBookmarks('repository-1');
    await adapter.createBookmark('repository-1', {} as never);
    await adapter.updateBookmark('repository-1', 'bookmark-1', {} as never);
    await adapter.reorderBookmarks('repository-1', {} as never);
    await adapter.deleteBookmark('repository-1', 'bookmark-1');

    expectChannelsRegistered(recorder.channels(), channelSet(RepositoryChannels));
  });

  it('governance adapter only invokes registered desktop governance channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = new RuleIpcAdapter(recorder as never);

    await adapter.createRule({} as never);
    await adapter.getRule({} as never);
    await adapter.updateRule('rule-1', {} as never);
    await adapter.deleteRule({} as never);
    await adapter.listRules();
    await adapter.searchRules({} as never);
    await adapter.getRevisions({} as never);

    expectChannelsRegistered(recorder.channels(), channelSet(GovernanceChannels));
  });

  it('ai adapters only invoke registered desktop ai channels', async () => {
    const recorder = createIpcRecorder((channel) => {
      if (channel === AIChannels.PROVIDER_LIST) {
        return { ok: true, data: { data: [] } };
      }
      return { ok: true, data: null };
    });
    const providerAdapter = new AIProviderConfigIpcAdapter(recorder as never);
    const conversationAdapter = new AIConversationIpcAdapter(recorder as never);
    const messageAdapter = new AIMessageIpcAdapter(recorder as never);
    const goalAdapter = new AIGoalIpcAdapter(recorder as never);
    const knowledgeAdapter = new AIKnowledgeNoteIpcAdapter(recorder as never);

    await providerAdapter.createProvider({} as never);
    await providerAdapter.getProviders();
    await providerAdapter.getProviderById('provider-1');
    await providerAdapter.updateProvider('provider-1', {} as never);
    await providerAdapter.deleteProvider('provider-1');
    await providerAdapter.testConnection({} as never);
    await providerAdapter.setDefaultProvider({} as never);
    await providerAdapter.refreshProviderModels('provider-1');

    await conversationAdapter.createConversation({} as never);
    await conversationAdapter.updateConversation('conversation-1', {} as never);
    await conversationAdapter.getConversations();
    await conversationAdapter.getConversationById('conversation-1');
    await conversationAdapter.deleteConversation('conversation-1');

    await messageAdapter.sendMessage({} as never);
    await messageAdapter.getMessages('conversation-1');

    await goalAdapter.generateGoal({} as never);
    await knowledgeAdapter.createKnowledgeNote({} as never);

    expectChannelsRegistered(recorder.channels(), channelSet(AIChannels));
  });

  it('ai provider adapter accepts raw provider-list payloads from desktop IPC', async () => {
    const recorder = createIpcRecorder((channel) => {
      if (channel === AIChannels.PROVIDER_LIST) {
        return {
          ok: true,
          data: [
            {
              id: 'provider-1',
              name: 'OpenAI',
              baseUrl: 'https://api.openai.com/v1',
              apiKeyMasked: 'sk-****1234',
              defaultModel: 'gpt-4o-mini',
              availableModels: [{ id: 'gpt-4o-mini', name: 'gpt-4o-mini' }],
              isActive: true,
              isDefault: true,
            },
          ],
        };
      }
      return { ok: true, data: null };
    });
    const adapter = new AIProviderConfigIpcAdapter(recorder as never);

    const providers = await adapter.getProviders();

    expect(providers).toHaveLength(1);
    expect(providers[0]?.id).toBe('provider-1');
    expect(providers[0]?.defaultModel).toBe('gpt-4o-mini');
  });
});
