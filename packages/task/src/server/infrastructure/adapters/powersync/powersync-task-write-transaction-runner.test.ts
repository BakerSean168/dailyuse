import { afterEach, describe, expect, it, vi } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import type {
  IElectronDatabase,
  IElectronDatabaseQueryResult,
  IElectronDatabaseTransaction,
} from '@dailyuse/contracts/electron';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskType } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils/domain';
import { TaskTemplate } from '@/server/domain/aggregates/task-template';
import { RecurrenceRule, TaskTimeConfig } from '@/server/domain/value-objects';
import { anIdentityId } from '@/testing';
import { createTaskPowerSyncModule } from '../../powersync';
import { PowerSyncTaskInstanceRepository } from './task-instance-powersync.repository';
import { PowerSyncTaskWriteTransactionRunner } from './powersync-task-write-transaction-runner';

type TemplateRecord = { id: string };
type InstanceRecord = { id: string; templateId: string };
type StateSnapshot = {
  templates: Map<string, TemplateRecord>;
  instances: Map<string, InstanceRecord>;
};

class FakePowerSyncTaskDb implements IElectronDatabase {
  private state: StateSnapshot = {
    templates: new Map(),
    instances: new Map(),
  };

  get templateCount(): number {
    return this.state.templates.size;
  }

  get instanceCount(): number {
    return this.state.instances.size;
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
    };
  }

  private async executeAgainst(
    state: StateSnapshot,
    sql: string,
    parameters?: unknown[],
  ): Promise<IElectronDatabaseQueryResult> {
    if (sql.includes('INSERT INTO task_templates')) {
      const id = String(parameters?.[0]);
      state.templates.set(id, { id });
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
      state.instances.set(id, { id, templateId });
      return { rowsAffected: 1 };
    }

    if (sql.includes('UPDATE task_instances')) {
      const id = String(parameters?.[(parameters?.length ?? 1) - 1]);
      const existing = state.instances.get(id);
      state.instances.set(id, existing ?? { id, templateId: String(parameters?.[0]) });
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

    if (sql.includes('SELECT id FROM task_instances WHERE id = ?')) {
      const id = String(parameters?.[0]);
      return (state.instances.has(id) ? { id } : null) as T | null;
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
    const sendSpy = vi.spyOn(eventBus, 'send').mockImplementation(() => undefined);
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
      sentBeforeCommit = sendSpy.mock.calls.length > 0;
    });

    expect(sentBeforeCommit).toBe(false);
    expect(db.templateCount).toBe(1);
    expect(sendSpy).toHaveBeenCalledWith(
      'task:created',
      expect.objectContaining({ templateId: template.id }),
    );
  });

  it('rolls back task module writes and publishes nothing when instance persistence fails', async () => {
    const db = new FakePowerSyncTaskDb();
    const module = createTaskPowerSyncModule(db);
    const sendSpy = vi.spyOn(eventBus, 'send').mockImplementation(() => undefined);
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
    expect(sendSpy).not.toHaveBeenCalled();

    module.dispose();
  });
});
