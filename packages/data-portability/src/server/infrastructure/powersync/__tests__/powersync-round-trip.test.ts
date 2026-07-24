import type {
  IElectronDatabase,
  IElectronDatabaseQueryResult,
  IElectronDatabaseTransaction,
} from '@dailyuse/contracts/electron';
import { DataPortabilityEventTopics } from '@dailyuse/contracts/data-portability';
import { eventBus } from '@dailyuse/utils/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportUserDataUseCase } from '../../../application/use-cases/export-user-data.use-case';
import { ImportUserDataUseCase } from '../../../application/use-cases/import-user-data.use-case';
import { createPowerSyncDataPortabilityDependencies } from '../powersync-export-dependencies';
import { PowerSyncDataPortabilityImportStore } from '../powersync-import-store';

type Row = Record<string, unknown>;
type SeedTables = Record<string, Row[]>;

interface ExecutedStatement {
  readonly sql: string;
  readonly parameters?: unknown[];
}

interface FakeDbOptions {
  readonly existingSingletonsIdentityId?: string;
  readonly failOnExecute?: (statement: ExecutedStatement) => boolean;
}

const identityA = 'identity-profile-a';
const identityB = 'identity-profile-b';
const now = '2026-06-04T00:00:00.000Z';
const later = '2026-06-04T01:00:00.000Z';

describe('PowerSync desktop data portability round trip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports one profile, imports into another profile with remapped ids, and appends repeated imports', async () => {
    const eventSpy = vi.spyOn(eventBus, 'send');
    const sourceDb = new FakePowerSyncDb(seedProfile(identityA));
    const exportUseCase = new ExportUserDataUseCase(
      createPowerSyncDataPortabilityDependencies(sourceDb.asElectronDatabase()),
    );

    const exported = await exportUseCase.execute(identityA);

    expect(exported.content).not.toContain(identityA);
    expect(exported.content).not.toContain('"identity_id"');
    expect(exported.content).not.toContain('"identityId"');
    expect(exported.content).not.toContain('"id":');
    expect(exported.content).not.toContain('apiKey');
    expect(exported.content).not.toContain('secret-key');
    expect(exported.content).not.toContain('sessionToken');
    expect(exported.content).toContain('"repositories"');
    expect(exported.content).toContain('"goals"');
    expect(exported.content).toContain('"templates"');
    expect(exported.content).toContain('"groups"');
    expect(exported.content).toContain('"tasks"');
    expect(exported.content).toContain('"workspaces"');
    expect(exported.content).toContain('"conversations"');

    const targetDb = new FakePowerSyncDb({}, { existingSingletonsIdentityId: identityB });
    const importUseCase = new ImportUserDataUseCase(
      new PowerSyncDataPortabilityImportStore(targetDb.asElectronDatabase()),
    );

    await importUseCase.execute(identityB, exported.content);
    const firstStatements = [...targetDb.committedStatements];
    const firstStatementCount = firstStatements.length;

    expect(JSON.stringify(firstStatements)).toContain(identityB);
    expect(JSON.stringify(firstStatements)).not.toContain(identityA);
    expect(JSON.stringify(firstStatements)).not.toContain('repo-a');
    expect(JSON.stringify(firstStatements)).not.toContain('folder-a');
    expect(JSON.stringify(firstStatements)).not.toContain('resource-a');
    expect(JSON.stringify(firstStatements)).not.toContain('goal-a');
    expect(JSON.stringify(firstStatements)).not.toContain('kr-a');
    expect(JSON.stringify(firstStatements)).not.toContain('task-template-a');
    expect(JSON.stringify(firstStatements)).not.toContain('reminder-template-a');
    expect(JSON.stringify(firstStatements)).not.toContain('workspace-a');
    expect(JSON.stringify(firstStatements)).not.toContain('conversation-a');

    const repository = insertedRow(firstStatements, 'repositories');
    const folder = insertedRow(firstStatements, 'folders');
    const resource = insertedRow(firstStatements, 'resources');
    const goal = insertedRow(firstStatements, 'goals');
    const keyResult = insertedRow(firstStatements, 'key_results');
    const goalRecord = insertedRow(firstStatements, 'goal_records');
    const taskFolder = insertedRow(firstStatements, 'task_folders');
    const taskTemplate = insertedRow(firstStatements, 'task_templates');
    const taskInstance = insertedRow(firstStatements, 'task_instances');
    const scheduleTask = insertedRow(firstStatements, 'schedule_tasks');
    const reminderGroup = insertedRow(firstStatements, 'reminder_groups');
    const reminderTemplate = insertedRow(firstStatements, 'reminder_templates');
    const reminderResponse = insertedRow(firstStatements, 'reminder_responses');
    const workspace = insertedRow(firstStatements, 'editor_workspaces');
    const session = insertedRow(firstStatements, 'editor_workspace_sessions');
    const group = insertedRow(firstStatements, 'editor_workspace_session_groups');
    const tab = insertedRow(firstStatements, 'editor_workspace_session_group_tabs');
    const conversation = insertedRow(firstStatements, 'ai_conversations');
    const message = insertedRow(firstStatements, 'ai_messages');

    expect(folder.repository_id).toBe(repository.id);
    expect(resource.repository_id).toBe(repository.id);
    expect(resource.folder_id).toBe(folder.id);
    expect(keyResult.goal_id).toBe(goal.id);
    expect(goalRecord.key_result_id).toBe(keyResult.id);
    expect(taskTemplate.folder_id).toBe(taskFolder.id);
    expect(taskInstance.template_id).toBe(taskTemplate.id);
    expect(scheduleTask.source_entity_id).toBe(taskTemplate.id);
    expect(reminderTemplate.reminder_group_id).toBe(reminderGroup.id);
    expect(reminderResponse.template_id).toBe(reminderTemplate.id);
    expect(session.workspace_id).toBe(workspace.id);
    expect(group.session_id).toBe(session.id);
    expect(group.workspace_id).toBe(workspace.id);
    expect(tab.group_id).toBe(group.id);
    expect(tab.session_id).toBe(session.id);
    expect(tab.workspace_id).toBe(workspace.id);
    expect(tab.resource_id).toBe(resource.id);
    expect(message.conversation_id).toBe(conversation.id);

    await importUseCase.execute(identityB, exported.content);
    const secondStatements = targetDb.committedStatements.slice(firstStatementCount);
    const secondRepository = insertedRow(secondStatements, 'repositories');
    const secondTaskTemplate = insertedRow(secondStatements, 'task_templates');

    expect(secondRepository.id).not.toBe(repository.id);
    expect(secondTaskTemplate.id).not.toBe(taskTemplate.id);

    expect(eventSpy).toHaveBeenCalledWith(
      DataPortabilityEventTopics.EXPORTED,
      expect.objectContaining({
        identityId: identityA,
        fileName: exported.fileName,
      }),
    );

    const importedEvents = eventSpy.mock.calls.filter(
      ([topic]) => topic === DataPortabilityEventTopics.IMPORTED,
    );
    expect(importedEvents).toHaveLength(2);
    expect(importedEvents[0]?.[1]).toEqual(
      expect.objectContaining({
        identityId: identityB,
        updatedSingletons: expect.objectContaining({
          settings: 1,
          notificationPreference: 1,
          userReminderPreference: 1,
        }),
      }),
    );
  });

  it('rejects forbidden identity fields before writing', async () => {
    const exported = await exportProfile(identityA);
    const envelope = JSON.parse(exported.content) as {
      data: {
        repositories: {
          repositories: Row[];
        };
      };
    };
    envelope.data.repositories.repositories[0].identityId = identityA;

    const targetDb = new FakePowerSyncDb({}, { existingSingletonsIdentityId: identityB });
    const importUseCase = new ImportUserDataUseCase(
      new PowerSyncDataPortabilityImportStore(targetDb.asElectronDatabase()),
    );

    await expect(importUseCase.execute(identityB, JSON.stringify(envelope))).rejects.toThrow();
    expect(targetDb.committedStatements).toHaveLength(0);
  });

  it('rolls back already staged writes when an import fails inside the transaction', async () => {
    const exported = await exportProfile(identityA);
    const targetDb = new FakePowerSyncDb(
      {},
      {
        existingSingletonsIdentityId: identityB,
        failOnExecute: (statement) => /INSERT\s+INTO\s+folders\s*\(/i.test(statement.sql),
      },
    );
    const importUseCase = new ImportUserDataUseCase(
      new PowerSyncDataPortabilityImportStore(targetDb.asElectronDatabase()),
    );

    await expect(importUseCase.execute(identityB, exported.content)).rejects.toThrow(
      'simulated write failure',
    );
    expect(targetDb.committedStatements).toHaveLength(0);
  });

  it('emits dry-run validated event without writing import rows', async () => {
    const eventSpy = vi.spyOn(eventBus, 'send');
    const exported = await exportProfile(identityA);
    const targetDb = new FakePowerSyncDb({}, { existingSingletonsIdentityId: identityB });
    const importUseCase = new ImportUserDataUseCase(
      new PowerSyncDataPortabilityImportStore(targetDb.asElectronDatabase()),
    );

    const result = await importUseCase.execute(identityB, exported.content, true);

    expect(result.dryRun).toBe(true);
    expect(targetDb.committedStatements).toHaveLength(0);
    expect(eventSpy).toHaveBeenCalledWith(
      DataPortabilityEventTopics.IMPORT_DRY_RUN_VALIDATED,
      expect.objectContaining({
        identityId: identityB,
        batchId: result.batchId,
        created: {},
        updatedSingletons: {},
        skipped: {},
      }),
    );
    expect(
      eventSpy.mock.calls.some(([topic]) => topic === DataPortabilityEventTopics.IMPORTED),
    ).toBe(false);
  });
});

async function exportProfile(identityUuid: string) {
  const sourceDb = new FakePowerSyncDb(seedProfile(identityUuid));
  const exportUseCase = new ExportUserDataUseCase(
    createPowerSyncDataPortabilityDependencies(sourceDb.asElectronDatabase()),
  );

  return exportUseCase.execute(identityUuid);
}

class FakePowerSyncDb {
  readonly committedStatements: ExecutedStatement[] = [];

  constructor(
    private readonly tables: SeedTables,
    private readonly options: FakeDbOptions = {},
  ) {}

  asElectronDatabase(): IElectronDatabase {
    return {
      execute: this.execute.bind(this),
      get: this.get.bind(this),
      getAll: this.getAll.bind(this),
      getOptional: this.getOptional.bind(this),
      readTransaction: this.readTransaction.bind(this),
      writeTransaction: this.writeTransaction.bind(this),
    } as unknown as IElectronDatabase;
  }

  execute(sql: string, parameters?: unknown[]): Promise<IElectronDatabaseQueryResult> {
    const statement = { sql, parameters };

    if (this.options.failOnExecute?.(statement)) {
      return Promise.reject(new Error('simulated write failure'));
    }

    this.committedStatements.push(statement);
    return Promise.resolve({ rowsAffected: 1 });
  }

  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]> {
    return Promise.resolve(this.selectRows(sql, parameters) as T[]);
  }

  async get<T>(sql: string, parameters?: unknown[]): Promise<T> {
    const row = await this.getOptional<T>(sql, parameters);

    if (!row) {
      throw new Error(`No row returned for query: ${sql}`);
    }

    return row;
  }

  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null> {
    const table = tableFromSelect(sql);
    const identityUuid = parameters?.[0];

    if (
      table &&
      ['user_settings', 'notification_preferences', 'user_reminder_preferences'].includes(table)
    ) {
      const seeded = this.liveRows(table).find((row) => row.identity_id === identityUuid);

      if (seeded) {
        return Promise.resolve(seeded as T);
      }

      if (identityUuid === this.options.existingSingletonsIdentityId) {
        return Promise.resolve(existingSingleton(table, identityUuid) as T);
      }
    }

    return Promise.resolve((this.selectRows(sql, parameters)[0] as T | undefined) ?? null);
  }

  readTransaction<T>(callback: (tx: IElectronDatabaseTransaction) => Promise<T>): Promise<T> {
    return callback(this.asTransaction([]));
  }

  async writeTransaction<T>(
    callback: (tx: IElectronDatabaseTransaction) => Promise<T>,
  ): Promise<T> {
    const pendingStatements: ExecutedStatement[] = [];
    const result = await callback(this.asTransaction(pendingStatements));
    this.committedStatements.push(...pendingStatements);

    return result;
  }

  private asTransaction(pendingStatements: ExecutedStatement[]): IElectronDatabaseTransaction {
    return {
      execute: (sql: string, parameters?: unknown[]) => {
        const statement = { sql, parameters };

        if (this.options.failOnExecute?.(statement)) {
          return Promise.reject(new Error('simulated write failure'));
        }

        pendingStatements.push(statement);
        return Promise.resolve({ rowsAffected: 1 });
      },
      get: this.get.bind(this),
      getAll: this.getAll.bind(this),
      getOptional: this.getOptional.bind(this),
    } as unknown as IElectronDatabaseTransaction;
  }

  private selectRows(sql: string, parameters?: unknown[]): Row[] {
    const table = tableFromSelect(sql);

    if (!table) {
      return [];
    }

    const rows = this.liveRows(table);
    const firstParameter = parameters?.[0];

    switch (table) {
      case 'goal_records': {
        // Residual 1332: export SQL binds [identityId, goalId] (not goalId alone).
        const identityId = parameters?.[0];
        const goalId = parameters?.[1];
        const keyResultIds = this.liveRows('key_results')
          .filter((row) => row.goal_id === goalId)
          .map((row) => row.id);

        return rows.filter(
          (row) =>
            row.identity_id === identityId && keyResultIds.includes(row.key_result_id),
        );
      }
      case 'key_results':
      case 'goal_reviews':
        return rows.filter((row) => row.goal_id === firstParameter);
      case 'folders':
        return rows.filter((row) => row.repository_id === firstParameter);
      case 'reminder_responses':
        return rows.filter((row) => row.template_id === firstParameter);
      case 'editor_workspace_sessions':
        return rows.filter((row) => row.workspace_id === firstParameter);
      case 'editor_workspace_session_groups':
        return rows.filter((row) => row.session_id === firstParameter);
      case 'editor_workspace_session_group_tabs':
        return rows.filter((row) => row.group_id === firstParameter);
      case 'ai_messages':
        return rows.filter((row) => row.conversation_id === firstParameter);
      default:
        return rows.filter((row) => row.identity_id === firstParameter);
    }
  }

  private liveRows(table: string): Row[] {
    return (this.tables[table] ?? []).filter(
      (row) => row.deleted_at === undefined || row.deleted_at === null,
    );
  }
}

function tableFromSelect(sql: string): string | null {
  return /FROM\s+([a-z_]+)/i.exec(sql)?.[1] ?? null;
}

function insertedRow(statements: ExecutedStatement[], table: string): Row {
  const statement = statements.find((candidate) =>
    new RegExp(`INSERT\\s+INTO\\s+${table}\\s*\\(`, 'i').test(candidate.sql),
  );

  if (!statement) {
    throw new Error(`Missing INSERT for ${table}`);
  }

  return rowFromInsert(statement);
}

function rowFromInsert(statement: ExecutedStatement): Row {
  const match = /INSERT\s+INTO\s+[a-z_]+\s*\(([\s\S]*?)\)\s*VALUES/i.exec(statement.sql);

  if (!match) {
    throw new Error(`Unsupported INSERT statement: ${statement.sql}`);
  }

  const columns = match[1].split(',').map((column) => column.trim());

  return Object.fromEntries(
    columns.map((column, index) => [column, statement.parameters?.[index]]),
  );
}

function existingSingleton(table: string, identityUuid: unknown): Row {
  switch (table) {
    case 'user_settings':
      return {
        id: 'existing-settings-b',
        identity_id: identityUuid,
        preferences: '{}',
        created_at: now,
        updated_at: now,
      };
    case 'notification_preferences':
      return {
        id: 'existing-notification-b',
        identity_id: identityUuid,
        enabled: 1,
        channels: '{}',
        categories: '{}',
        do_not_disturb: null,
        rate_limit: null,
        created_at: now,
        updated_at: now,
      };
    case 'user_reminder_preferences':
      return {
        id: 'existing-reminder-preference-b',
        identity_id: identityUuid,
        global_reminder_enabled: 1,
        global_smart_frequency: 0,
        default_snooze_minutes: 10,
        max_daily_reminders: 10,
        preferred_hours_start: 9,
        preferred_hours_end: 18,
        timezone: 'Asia/Shanghai',
        enable_weekend_reminders: 1,
        enable_location_based_reminders: 0,
        enable_voice_reminders: 0,
        enable_sound: 1,
        enable_vibration: 1,
        enable_notification_badge: 1,
        best_time_slots: '[]',
        worst_time_slots: '[]',
        adaptive_timing: 1,
        learning_enabled: 1,
        created_at: now,
        updated_at: now,
      };
    default:
      throw new Error(`Unsupported singleton table: ${table}`);
  }
}

/**
 * Seed data uses real PowerSync snake_case column names.
 * The export dependencies mapRow() converts them to camelCase
 * before passing to projections.
 */
function seedProfile(identityUuid: string): SeedTables {
  return {
    user_settings: [
      {
        id: 'settings-a',
        identity_id: identityUuid,
        preferences: JSON.stringify({
          appearance: { theme: 'dark' },
          editor: { fontSize: 14 },
        }),
        created_at: now,
        updated_at: later,
      },
    ],
    notification_preferences: [
      {
        id: 'notification-preference-a',
        identity_id: identityUuid,
        enabled: 1,
        channels: JSON.stringify({ desktop: true }),
        categories: JSON.stringify({ reminders: true }),
        do_not_disturb: JSON.stringify({ enabled: false }),
        rate_limit: JSON.stringify({ perHour: 20 }),
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    user_reminder_preferences: [
      {
        id: 'reminder-preference-a',
        identity_id: identityUuid,
        global_reminder_enabled: 1,
        global_smart_frequency: 0,
        default_snooze_minutes: 10,
        max_daily_reminders: 10,
        preferred_hours_start: 9,
        preferred_hours_end: 18,
        timezone: 'Asia/Shanghai',
        enable_weekend_reminders: 1,
        enable_location_based_reminders: 0,
        enable_voice_reminders: 0,
        enable_sound: 1,
        enable_vibration: 1,
        enable_notification_badge: 1,
        best_time_slots: JSON.stringify([{ start: '09:00', end: '11:00' }]),
        worst_time_slots: JSON.stringify([{ start: '23:00', end: '07:00' }]),
        adaptive_timing: 1,
        learning_enabled: 1,
        created_at: now,
        updated_at: later,
      },
    ],
    repositories: [
      {
        id: 'repo-a',
        identity_id: identityUuid,
        name: 'Knowledge',
        type: 'local',
        path: '/portable/knowledge',
        description: null,
        config: JSON.stringify({ layout: 'tree', apiKey: 'secret-key' }),
        status: 'active',
        is_default: 1,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    folders: [
      {
        id: 'folder-a',
        identity_id: identityUuid,
        repository_id: 'repo-a',
        name: 'Projects',
        path: '/Projects',
        parent_id: null,
        order: 0,
        is_expanded: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    resources: [
      {
        id: 'resource-a',
        identity_id: identityUuid,
        repository_id: 'repo-a',
        folder_id: 'folder-a',
        name: 'Launch note',
        type: 'markdown',
        path: '/Projects/launch.md',
        size: 128,
        content: '# Launch',
        metadata: JSON.stringify({ tags: ['portable'] }),
        status: 'active',
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    goal_folders: [
      {
        id: 'goal-folder-a',
        identity_id: identityUuid,
        name: 'Outcome',
        parent_folder_id: null,
        sort_order: 0,
        is_system_folder: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    goals: [
      {
        id: 'goal-a',
        identity_id: identityUuid,
        folder_id: 'goal-folder-a',
        name: 'Ship portability',
        description: 'Complete desktop portability',
        color: '#3B82F6',
        status: 'active',
        importance: 'high',
        priority: 1,
        sort_order: 0,
        start_date: now,
        target_date: later,
        completed_at: null,
        tags: JSON.stringify(['release']),
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    key_results: [
      {
        id: 'kr-a',
        identity_id: identityUuid,
        goal_id: 'goal-a',
        title: 'Round trip passes',
        description: 'Automated proof',
        value_type: 'numeric',
        initial_value: 0,
        current_value: 1,
        target_value: 1,
        unit: 'test',
        weight: 1,
        order: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    goal_reviews: [
      {
        id: 'goal-review-a',
        identity_id: identityUuid,
        goal_id: 'goal-a',
        review_type: 'completion',
        content: 'Looks good',
        rating: 5,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    goal_records: [
      {
        id: 'goal-record-a',
        identity_id: identityUuid,
        key_result_id: 'kr-a',
        value: 1,
        note: 'Done',
        recorded_at: later,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    focus_sessions: [
      {
        id: 'focus-session-a',
        identity_id: identityUuid,
        goal_id: 'goal-a',
        description: 'Verify portability',
        status: 'completed',
        duration_minutes: 60,
        actual_duration_minutes: 55,
        started_at: now,
        completed_at: later,
        pause_count: 0,
        paused_duration_minutes: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    focus_modes: [
      {
        id: 'focus-mode-a',
        identity_id: identityUuid,
        focused_goal_ids: JSON.stringify(['goal-a']),
        hidden_goals_mode: 'dim',
        start_time: now,
        end_time: later,
        is_active: 1,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    task_folders: [
      {
        id: 'task-folder-a',
        identity_id: identityUuid,
        name: 'Build',
        color: null,
        icon: null,
        order: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    task_templates: [
      {
        id: 'task-template-a',
        identity_id: identityUuid,
        folder_id: 'task-folder-a',
        name: 'Write tests',
        description: 'Cover profile round trip',
        status: 'active',
        importance: 'high',
        priority: 1,
        tags: JSON.stringify(['qa']),
        checklist: JSON.stringify([{ title: 'run tests', checked: true }]),
        time_config_type: 'fixed',
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    task_instances: [
      {
        id: 'task-instance-a',
        template_id: 'task-template-a',
        identity_id: identityUuid,
        instance_date: now,
        status: 'completed',
        importance: 'high',
        priority: 1,
        time_config: JSON.stringify({ startTime: now, endTime: later }),
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    task_dependencies: [],
    reminder_groups: [
      {
        id: 'reminder-group-a',
        identity_id: identityUuid,
        name: 'Delivery',
        description: 'Delivery reminders',
        control_mode: 'manual',
        enabled: 1,
        status: 'active',
        order: 0,
        color: '#3366ff',
        icon: 'bell',
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    reminder_templates: [
      {
        id: 'reminder-template-a',
        identity_id: identityUuid,
        reminder_group_id: 'reminder-group-a',
        name: 'Check import',
        description: 'Verify imported data',
        type: 'custom',
        self_enabled: 1,
        status: 'active',
        importance_level: 'normal',
        trigger: JSON.stringify({ type: 'time', at: later }),
        active_time: JSON.stringify({ start: '09:00', end: '18:00' }),
        notification_config: JSON.stringify({ channel: 'desktop' }),
        tags: JSON.stringify(['portable']),
        stats: JSON.stringify({ triggered: 1 }),
        smart_frequency_enabled: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    reminder_responses: [
      {
        id: 'reminder-response-a',
        template_id: 'reminder-template-a',
        identity_id: identityUuid,
        action: 'dismiss',
        response_time: 1700000000,
        timestamp: later,
        created_at: now,
      },
    ],
    schedules: [
      {
        id: 'schedule-a',
        identity_id: identityUuid,
        title: 'Design review',
        description: 'Review portability',
        start_time: now,
        end_time: later,
        duration: 60,
        location: 'Online',
        attendees: JSON.stringify(['teammate']),
        created_at: now,
        updated_at: later,
      },
    ],
    schedule_tasks: [
      {
        id: 'schedule-task-a',
        identity_id: identityUuid,
        name: 'Daily test run',
        description: 'Run portability tests',
        source_module: 'task',
        source_entity_id: 'task-template-a',
        status: 'active',
        enabled: 1,
        cron_expression: '0 8 * * *',
        timezone: 'Asia/Shanghai',
        start_date: now,
        end_date: null,
        next_run_at: later,
        last_run_at: null,
        execution_count: 1,
        max_retries: 3,
        initial_delay_ms: 1000,
        max_delay_ms: 30000,
        backoff_multiplier: 2,
        consecutive_failures: 0,
        retryable_statuses: JSON.stringify(['timeout']),
        payload: JSON.stringify({ source: 'round-trip' }),
        tags: JSON.stringify(['portable']),
        timeout: 30000,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    editor_workspaces: [
      {
        id: 'workspace-a',
        identity_id: identityUuid,
        name: 'Writing',
        description: null,
        project_path: '/workspace/writing',
        project_type: 'notes',
        layout: JSON.stringify({ split: 'right' }),
        setting: JSON.stringify({ autosave: true }),
        is_active: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    editor_workspace_sessions: [
      {
        id: 'session-a',
        workspace_id: 'workspace-a',
        identity_id: identityUuid,
        name: 'Main',
        layout: JSON.stringify({
          groups: [{ groupIndex: 0, activeTabIndex: 0 }],
        }),
        is_active: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    editor_workspace_session_groups: [
      {
        id: 'group-a',
        session_id: 'session-a',
        workspace_id: 'workspace-a',
        identity_id: identityUuid,
        group_index: 0,
        name: null,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    editor_workspace_session_group_tabs: [
      {
        id: 'tab-a',
        group_id: 'group-a',
        session_id: 'session-a',
        workspace_id: 'workspace-a',
        identity_id: identityUuid,
        resource_id: 'resource-a',
        tab_index: 0,
        tab_type: 'editor',
        title: 'Launch note',
        view_state: JSON.stringify({ cursor: 1 }),
        is_pinned: 0,
        is_active: 0,
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    ai_conversations: [
      {
        id: 'conversation-a',
        identity_id: identityUuid,
        name: 'Portability help',
        status: 'active',
        created_at: now,
        updated_at: later,
        deleted_at: null,
      },
    ],
    ai_messages: [
      {
        id: 'message-a',
        conversation_id: 'conversation-a',
        identity_id: identityUuid,
        role: 'assistant',
        content: 'Round trip ready',
        token_usage: JSON.stringify({ totalTokens: 4 }),
        created_at: now,
      },
    ],
  };
}
