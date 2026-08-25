import { afterEach, describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import type {
  IElectronDatabase,
  IElectronDatabaseQueryResult,
  IElectronDatabaseTransaction,
} from '@memoflow/contracts/electron';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { TaskGoalBindingTrigger, TaskType } from '@memoflow/contracts/task';
import { eventBus } from '@memoflow/utils/domain';
import { TaskTemplate } from '../../../domain/aggregates/task-template';
import { RecurrenceRule, TaskTimeConfig } from '../../../domain/value-objects';
import { anIdentityId } from '../../../../testing';
import { createTaskPowerSyncModule } from '../../powersync';
import { PowerSyncTaskInstanceRepository } from './task-instance-powersync.repository';
import { PowerSyncTaskWriteTransactionRunner } from './powersync-task-write-transaction-runner';

type TemplateRecord = { id: string };
type InstanceRecord = { id: string; templateId: string };
type OutboxRecord = { id: string };
type StateSnapshot = {
  templates: Map<string, TemplateRecord>;
  instances: Map<string, InstanceRecord>;
  outbox: Map<string, OutboxRecord>;
};

class FakePowerSyncTaskDb implements IElectronDatabase {
  failOutbox = false;
  private state: StateSnapshot = {
    templates: new Map(),
    instances: new Map(),
    outbox: new Map(),
  };

  get templateCount(): number {
    return this.state.templates.size;
  }

  get instanceCount(): number {
    return this.state.instances.size;
  }

  get outboxCount(): number {
    return this.state.outbox.size;
  }

  async execute(sql: string, parameters?: unknown[]): Promise<IElectronDatabaseQueryResult> {
    return this.executeAgainst(this.state, sql, parameters);
  }

  async getAll<T>(_sql: string, _parameters?: unknown[]): Promise<T[]> {
    return [] as T[];
  }

  async getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null> {
    return this.getOptionalAgainst(this.state, sql, parameters);
  }

  async get<T>(sql: string, parameters?: unknown[]): Promise<T> {
    const row = await this.getOptional<T>(sql, parameters);
    if (row === null) {
      throw new Error(`No row found for query: ${sql}`);
    }

    return row;
  }

  async writeTransaction<T>(
    callback: (tx: IElectronDatabaseTransaction) => Promise<T>,
  ): Promise<T> {
    const staged = this.cloneState(this.state);
    const tx: IElectronDatabaseTransaction = {
      execute: (sql, parameters) => this.executeAgainst(staged, sql, parameters),
      getAll: async <T>() => [] as T[],
      getOptional: <T>(sql: string, parameters?: unknown[]) =>
        this.getOptionalAgainst<T>(staged, sql, parameters),
      get: async <T>(sql: string, parameters?: unknown[]) => {
        const row = await this.getOptionalAgainst<T>(staged, sql, parameters);
        if (row === null) {
          throw new Error(`No row found for query: ${sql}`);
        }

        return row;
      },
    };

    const result = await callback(tx);
    this.state = staged;
    return result;
  }

  private cloneState(source: StateSnapshot): StateSnapshot {
    return {
      templates: new Map(source.templates),
      instances: new Map(source.instances),
      outbox: new Map(source.outbox),
    };
  }

  private async executeAgainst(
    state: StateSnapshot,
    sql: string,
    parameters?: unknown[],
  ): Promise<IElectronDatabaseQueryResult> {
    if (sql.includes('INSERT OR IGNORE INTO task_goal_outbox')) {
      if (this.failOutbox) {
        throw new Error('PowerSync outbox write failure simulation');
      }
      const id = String(parameters?.[0]);
      state.outbox.set(id, { id });
      return { rowsAffected: 1 };
    }

    if (sql.includes('INSERT INTO task_templates')) {
      const id = String(parameters?.[0]);
      state.templates.set(id, { id, _params: parameters ?? [] });
      return { rowsAffected: 1 };
    }

    if (sql.includes('UPDATE task_templates')) {
      const id = String(parameters?.[(parameters?.length ?? 1) - 1]);
      state.templates.set(id, { id });
      return { rowsAffected: 1 };
    }

    if (sql.includes('DELETE FROM task_templates WHERE id = ?')) {
      state.templates.delete(String(parameters?.[0]));
      return { rowsAffected: 1 };
    }

    if (sql.includes('INSERT INTO task_instances')) {
      const id = String(parameters?.[0]);
      const templateId = String(parameters?.[1]);
      const identityId = String(parameters?.[2]);
      const instanceDate = String(parameters?.[3]);
      const status = String(parameters?.[4]);
      const importance = parameters?.[5] == null ? null : String(parameters[5]);
      const priority = parameters?.[6] == null ? null : Number(parameters[6]);
      const timeConfig = String(parameters?.[7]);
      state.instances.set(id, {
        id,
        template_id: templateId,
        identity_id: identityId,
        instance_date: instanceDate,
        occurrence_key: null,
        status,
        importance,
        priority,
        time_config: timeConfig,
        actual_start_time: null,
        actual_end_time: null,
        comment: null,
        version: 0,
        created_at: instanceDate,
        updated_at: instanceDate,
        deleted_at: null,
      });
      return { rowsAffected: 1 };
    }

    if (sql.includes('UPDATE task_instances')) {
      const id = String(parameters?.[(parameters?.length ?? 1) - 1]);
      const existing = state.instances.get(id);
      if (existing) {
        // Apply the status update (status is the 4th SET column) so the
        // rollback assertion is a REAL proof, not a vacuous one.
        const status = parameters?.[3] == null ? (existing as { status?: string }).status : String(parameters[3]);
        state.instances.set(id, { ...existing, status });
      } else {
        state.instances.set(id, { id, template_id: String(parameters?.[0]), status: 'Pending' });
      }
      return { rowsAffected: 1 };
    }

    if (sql.includes('DELETE FROM task_instances WHERE template_id = ?')) {
      const templateId = String(parameters?.[0]);
      for (const [id, record] of state.instances.entries()) {
        if (record.templateId === templateId) {
          state.instances.delete(id);
        }
      }
      return { rowsAffected: 1 };
    }

    if (sql.includes('DELETE FROM task_instances WHERE id = ?')) {
      state.instances.delete(String(parameters?.[0]));
      return { rowsAffected: 1 };
    }

    if (sql.includes('DELETE FROM task_instances WHERE id IN')) {
      for (const id of parameters ?? []) {
        state.instances.delete(String(id));
      }
      return { rowsAffected: Array.isArray(parameters) ? parameters.length : 0 };
    }

    throw new Error(`Unsupported execute SQL in test double: ${sql}`);
  }

  private async getOptionalAgainst<T>(
    state: StateSnapshot,
    sql: string,
    parameters?: unknown[],
  ): Promise<T | null> {
    if (sql.includes('SELECT id FROM task_templates WHERE id = ?')) {
      const id = String(parameters?.[0]);
      return (state.templates.has(id) ? { id } : null) as T | null;
    }

    if (sql.includes('FROM task_templates WHERE id = ? AND identity_id = ?')) {
      const id = String(parameters?.[0]);
      const row = state.templates.get(id);
      if (row) {
        // Rebuild a row from the stored INSERT parameters so goal binding fields survive.
        const prm = (row as { _params?: unknown[] })._params ?? [];
        const rowShape: Record<string, unknown> = {
          id,
          identity_id: String(prm[1] ?? ''),
          name: String(prm[2] ?? ''),
          task_type: String(prm[3] ?? ''),
          status: String(prm[4] ?? ''),
          time_config: String(prm[5] ?? '{}'),
          recurrence_rule: String(prm[6] ?? '{}'),
          importance: prm[7] == null ? null : String(prm[7]),
          priority: prm[8] == null ? null : Number(prm[8]),
          tags: String(prm[9] ?? '[]'),
          goal_id: prm[10] == null ? null : String(prm[10]),
          key_result_id: prm[11] == null ? null : String(prm[11]),
          goal_record_value: prm[12] == null ? null : Number(prm[12]),
        };
        return rowShape as unknown as T;
      }
      return null;
    }

    if (sql.includes('SELECT id FROM task_instances WHERE id = ?')) {
      const id = String(parameters?.[0]);
      return (state.instances.has(id) ? { id } : null) as T | null;
    }

    if (sql.includes('SELECT status FROM task_instances WHERE id = ?')) {
      const id = String(parameters?.[0]);
      const row = state.instances.get(id);
      return (row ? { status: (row as { status?: string }).status ?? 'pending' } : null) as T | null;
    }

    if (sql.includes('FROM task_instances WHERE id = ? AND identity_id = ?')) {
      const id = String(parameters?.[0]);
      const identityId = String(parameters?.[1]);
      const row = state.instances.get(id);
      if (row && (row as { identity_id?: string }).identity_id === identityId) {
        return row as unknown as T;
      }
      return null;
    }

    return null;
  }
}

describe('PowerSyncTaskWriteTransactionRunner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('publishes buffered domain events only after the write transaction commits', async () => {
    const db = new FakePowerSyncTaskDb();
    const runner = new PowerSyncTaskWriteTransactionRunner(db);
    const dispatchSpy = vi.spyOn(eventBus, 'dispatch').mockResolvedValue(undefined);
    const template = TaskTemplate.create({
      identityId: anIdentityId(),
      title: 'PowerSync write',
      taskType: TaskType.Recurring,
      timeConfig: TaskTimeConfig.createAllDay(new Date()),
      recurrenceRule: RecurrenceRule.createDaily(1),
      importance: ImportanceLevel.Moderate,
      tags: [],
    });

    let sentBeforeCommit = false;

    await runner.run(async ({ templateRepository }) => {
      await templateRepository.save(template);
      sentBeforeCommit = dispatchSpy.mock.calls.length > 0;
    });

    expect(sentBeforeCommit).toBe(false);
    expect(db.templateCount).toBe(1);
    // W5 metadata contract: the reliable delivery adapter passes envelope metadata
    // (aggregateId / occurredAt / optional idempotencyKey) as the 3rd arg.
    expect(dispatchSpy).toHaveBeenCalledWith(
      'task:created',
      expect.objectContaining({ templateId: template.id }),
      expect.objectContaining({
        aggregateId: expect.any(String),
        occurredAt: expect.any(Date),
      }),
    );
  });

  it('rolls back task module writes and publishes nothing when instance persistence fails', async () => {
    const db = new FakePowerSyncTaskDb();
    const module = createTaskPowerSyncModule(db);
    const dispatchSpy = vi.spyOn(eventBus, 'dispatch').mockResolvedValue(undefined);
    vi.spyOn(PowerSyncTaskInstanceRepository.prototype, 'saveMany').mockRejectedValue(
      new Error('saveMany failed'),
    );

    const result = await module.api.createTaskTemplate({
      identityId: anIdentityId(),
      name: 'Daily Review',
      taskType: TaskType.Recurring,
      timeConfig: {
        timeType: 'AllDay',
        startDate: Date.now(),
        timePoint: null,
        timeRange: null,
      },
      recurrenceRule: {
        frequency: 'Daily',
        interval: 1,
        daysOfWeek: [],
        endDate: null,
        occurrences: null,
      },
      importance: ImportanceLevel.Moderate,
      tags: [],
    });

    expect(result).toBeErrorWithCode('INTERNAL_ERROR');
    expect(db.templateCount).toBe(0);
    expect(db.instanceCount).toBe(0);
    expect(dispatchSpy).not.toHaveBeenCalled();

    module.dispose();
  });

  it('rolls back task module writes, outbox and publishes nothing when task_goal_outbox insert fails', async () => {
    const db = new FakePowerSyncTaskDb();
    const module = createTaskPowerSyncModule(db);
    const dispatchSpy = vi.spyOn(eventBus, 'dispatch').mockResolvedValue(undefined);

    const identityId = anIdentityId();
    const createRes = await module.api.createTaskTemplate({
      identityId,
      name: 'Goal Task',
      taskType: TaskType.Recurring,
      timeConfig: {
        timeType: 'AllDay',
        startDate: Date.now(),
        timePoint: null,
        timeRange: null,
      },
      recurrenceRule: {
        frequency: 'Daily',
        interval: 1,
        daysOfWeek: [],
        endDate: null,
        occurrences: null,
      },
      importance: ImportanceLevel.Moderate,
      tags: [],
      goalBinding: {
        goalId: 'goal-1',
        keyResultId: 'kr-1',
        goalRecordValue: 1,
        progressTrigger: TaskGoalBindingTrigger.PerInstance,
      },
    });
    expect(createRes.ok).toBe(true);
    if (!createRes.ok) return;

    expect(db.instanceCount).toBeGreaterThan(0);
    const instanceId = Array.from((db as any).state.instances.keys())[0] as string;

    dispatchSpy.mockClear();

    db.failOutbox = true;

    const result = await module.api.completeTaskInstance(instanceId, identityId);

    expect(result).toBeErrorWithCode('INTERNAL_ERROR');
    expect(db.templateCount).toBe(1);
    expect(db.outboxCount).toBe(0);
    expect(dispatchSpy).not.toHaveBeenCalled();

    // The completed instance must have ROLLED BACK to its pre-complete status
    const instanceRow = await db.getOptional<{ status: string }>(
      'SELECT status FROM task_instances WHERE id = ?',
      [instanceId],
    );
    expect(instanceRow?.status).toBe('Pending');

    module.dispose();
  });
});
