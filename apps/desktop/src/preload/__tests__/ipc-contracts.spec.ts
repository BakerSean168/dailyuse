import { describe, expect, it, vi } from 'vitest';
import {
  AccountChannels,
  AIChannels,
  AuthChannels,
  DashboardChannels,
  DataPortabilityChannels,
  DesktopFeatureChannels,
  GoalChannels,
  GovernanceChannels,
  NotificationChannels,
  ReminderChannels,
  ScheduleChannels,
  SettingChannels,
  SystemChannels,
  TaskChannels,
  WindowChannels,
} from '../../shared/types/ipc-channels';
import { ALLOWED_CHANNELS, SUPPORTED_REPOSITORY_CHANNELS } from '../allowed-channels';
import { createAccountIpcClient } from '@dailyuse/account/client';
import { AuthIpcAdapter } from '@dailyuse/authentication/client';
import { createDataPortabilityIpcClient } from '@dailyuse/data-portability/client';
import {
  AIConversationIpcAdapter,
  AIGoalIpcAdapter,
  AIKnowledgeNoteIpcAdapter,
  AIMessageIpcAdapter,
  AIProviderConfigIpcAdapter,
} from '@dailyuse/ai/client';
import { createGovernanceIpcClient } from '@dailyuse/governance/client';
import { NotificationIpcAdapter } from '@dailyuse/notification/client';
import { TaskTemplateIpcAdapter } from '@dailyuse/task/client';
import { ScheduleEventIpcAdapter, ScheduleTaskIpcAdapter } from '@dailyuse/schedule/client';
import { ReminderIpcAdapter } from '@dailyuse/reminder/client';
import { RepositoryIpcAdapter } from '@dailyuse/repository/client';
import { createSettingIpcClient } from '@dailyuse/setting/client';

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
    expect(allowedByPrefix('repository:')).toEqual(new Set(SUPPORTED_REPOSITORY_CHANNELS));
  });

  it('does not expose the retired editor IPC surface', () => {
    expect(allowedByPrefix('editor:')).toEqual(new Set());
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

  it('keeps shared data-portability channels aligned with preload allowlist', () => {
    expect(allowedByPrefix('data-portability:')).toEqual(channelSet(DataPortabilityChannels));
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
    const recorder = createIpcRecorder((channel) => {
      if (channel === AccountChannels.GET_ME || channel === AccountChannels.UPDATE_PROFILE) {
        return {
          ok: true,
          data: {
            id: 'IdentityId_550e8400-e29b-41d4-a716-446655440001',
            status: 'Active',
            profile: {
              nickname: 'tester',
              realName: 'Test User',
              avatarUrl: null,
              bio: null,
              gender: 'PreferNotToSay',
              birthday: null,
            },
            settings: {
              theme: 'Light',
              language: 'zh-CN',
              timezone: 'Asia/Shanghai',
              notificationEnabled: true,
            },
            email: {
              address: 'test@example.com',
              isVerified: true,
              verifiedAt: new Date().toISOString(),
              isPrimary: true,
            },
            phone: null,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          },
        };
      }

      if (channel === AccountChannels.CHECK_AVAILABILITY) {
        return { ok: true, data: { available: true } };
      }

      return { ok: true, data: null };
    });
    const adapter = createAccountIpcClient(recorder as never);

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
    const adapter = createSettingIpcClient(recorder as never);

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

    await adapter.startKnowledgeRepositoryInstallation();
    await adapter.completeKnowledgeRepositoryInstallation({} as never);
    await adapter.listKnowledgeRepositoryConnections();
    await adapter.connectKnowledgeRepository({} as never);
    await adapter.disconnectKnowledgeRepository('connection-1');
    await adapter.previewKnowledgeRepositoryReconciliation('connection-1');
    await adapter.executeKnowledgeRepositoryReconciliation({} as never);
    await adapter.syncKnowledgeRepository({} as never);
    await adapter.issueDesktopKnowledgeRepositoryToken('connection-1');
    await adapter.getLocalVaultBinding();
    await adapter.selectLocalVault();
    await adapter.detachLocalVault();
    await adapter.scanLocalVault();
    await adapter.readLocalVaultNote({ relativePath: 'note.md' });
    await adapter.searchLocalVault({ query: 'note' });
    await adapter.openLocalVaultInObsidian({ relativePath: 'note.md' });
    await adapter.writeConfirmedLocalVaultNote({} as never);

    expectChannelsRegistered(recorder.channels(), new Set(SUPPORTED_REPOSITORY_CHANNELS));
  });

  it('governance adapter only invokes registered desktop governance channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = createGovernanceIpcClient(recorder as never);

    await adapter.createRule({} as never);
    await adapter.getRule({} as never);
    await adapter.updateRule('rule-1', {} as never);
    await adapter.deleteRule({} as never);
    await adapter.listRules();
    await adapter.searchRules({} as never);
    await adapter.getRevisions({} as never);

    expectChannelsRegistered(recorder.channels(), channelSet(GovernanceChannels));
  });

  it('data-portability adapter only invokes registered desktop data-portability channels', async () => {
    const recorder = createIpcRecorder();
    const adapter = createDataPortabilityIpcClient(recorder as never);

    await adapter.exportUserData({} as never);
    await adapter.importUserData({} as never);

    expectChannelsRegistered(recorder.channels(), channelSet(DataPortabilityChannels));
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
