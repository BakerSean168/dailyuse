import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import type {
  IElectronDatabase,
  IElectronDatabaseQueryResult,
} from '@memoflow/contracts/electron';
import { PowerSyncTaskBindingReadPort } from './powersync-task-binding-read-port';
import { GoalTaskBindingQueryInputSchema } from '@memoflow/contracts/reliable-messaging';

function createDb(): IElectronDatabase {
  const sqlite = new Database(':memory:');
  sqlite.exec(`CREATE TABLE IF NOT EXISTS task_templates (
    id TEXT PRIMARY KEY,
    identity_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    goal_id TEXT,
    deleted_at TEXT
  )`);
  const wrapper: IElectronDatabase = {
    async execute(sql: string, parameters?: unknown[]): Promise<IElectronDatabaseQueryResult> {
      const info = sqlite.prepare(sql).run(...(parameters ?? []));
      return { rowsAffected: info.changes };
    },
    async getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]> {
      return sqlite.prepare(sql).all(...(parameters ?? [])) as T[];
    },
    async getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null> {
      const row = sqlite.prepare(sql).get(...(parameters ?? []));
      return (row as T) ?? null;
    },
    async get<T>(sql: string, parameters?: unknown[]): Promise<T> {
      const row = sqlite.prepare(sql).get(...(parameters ?? []));
      if (!row) throw new Error('no rows');
      return row as T;
    },
  };
  return wrapper;
}

describe('PowerSyncTaskBindingReadPort (W4 P2-1)', () => {
  it('counts active bindings with identity isolation + soft-delete exclusion + schema validation', async () => {
    const db = createDb();
    await db.execute(
      `INSERT INTO task_templates (id, identity_id, name, status, goal_id, deleted_at) VALUES
       ('t1', 'id-A', 'A1', 'Active', 'goal-1', NULL),
       ('t2', 'id-A', 'A2', 'Active', 'goal-1', NULL),
       ('t3', 'id-A', 'A3 soft-deleted', 'Archived', 'goal-1', '2026-08-11T00:00:00.000Z'),
       ('t4', 'id-B', 'B1', 'Active', 'goal-1', NULL)`,
    );

    const port = new PowerSyncTaskBindingReadPort(db);
    const a = await port.checkActiveTaskBindings({ identityId: 'id-A', goalId: 'goal-1' });
    expect(a).toEqual({ hasActiveBindings: true, activeCount: 2 });

    const b = await port.checkActiveTaskBindings({ identityId: 'id-B', goalId: 'goal-1' });
    expect(b).toEqual({ hasActiveBindings: true, activeCount: 1 });

    const missing = await port.checkActiveTaskBindings({ identityId: 'id-A', goalId: 'goal-x' });
    expect(missing).toEqual({ hasActiveBindings: false, activeCount: 0 });

    expect(GoalTaskBindingQueryInputSchema.parse({ identityId: 'i', goalId: 'g' })).toBeTruthy();
    await expect(
      port.checkActiveTaskBindings({ identityId: '', goalId: 'g' } as never),
    ).rejects.toThrow();
  });
});
