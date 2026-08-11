import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GoalChannels } from '@memoflow/contracts/electron';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

/**
 * Goal electron seam surface (stage-6 residual):
 * Channel registration must use contracts GoalChannels only — no dual-track local Ch map.
 */
describe('createGoalElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via GoalChannels and does not redefine a local Ch map', () => {
    expect(source).toContain('GoalChannels');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).toContain('Object.values(GoalChannels)');
    expect(source).toContain('GoalChannels.LIST');
    expect(source).toContain('GoalChannels.ARCHIVE_EXPIRED');
    expect(source).toContain('GoalChannels.FOLDER_LIST');
  });

  it('keeps live archiveExpired channel on contracts surface', () => {
    expect(GoalChannels.ARCHIVE_EXPIRED).toBe('goal:archiveExpired');
  });
});

function createPowerSyncDb() {
    const Database = require('better-sqlite3') as typeof import('better-sqlite3');
    const sqlite = new Database(':memory:');
    const wrapper = {
      execute: async (sql: string, p?: unknown[]) => {
        const info = sqlite.prepare(sql).run(...(p ?? []));
        return { rowsAffected: info.changes };
      },
      getAll: async <T>(sql: string, p?: unknown[]) => sqlite.prepare(sql).all(...(p ?? [])) as T[],
      getOptional: async <T>(sql: string, p?: unknown[]) =>
        (sqlite.prepare(sql).get(...(p ?? [])) as T) ?? null,
      get: async <T>(sql: string, p?: unknown[]) => {
        const row = sqlite.prepare(sql).get(...(p ?? []));
        if (!row) throw new Error(`no rows: ${sql}`);
        return row as T;
      },
      writeTransaction: async <T>(cb: (tx: unknown) => Promise<T>) => {
        sqlite.exec('BEGIN');
        try {
          const r = await cb(wrapper);
          sqlite.exec('COMMIT');
          return r;
        } catch (e) {
          sqlite.exec('ROLLBACK');
          throw e;
        }
      },
    };
    return wrapper;
}

describe('GoalElectronModule.register() startup (W4 P2-1)', () => {
  it('composes without throwing when the host provides the Task binding port (fail-closed gate)', async () => {
    const db = createPowerSyncDb();
    const { createGoalPowerSyncModule } = await import('../server/infrastructure/powersync');
    expect(() =>
      createGoalPowerSyncModule(db, {
        taskBindingReadPort: {
          checkActiveTaskBindings: async () => ({ hasActiveBindings: false, activeCount: 0 }),
        },
      }),
    ).not.toThrow();
  });

  it('fails closed when the Task binding port is NOT provided', async () => {
    const db = createPowerSyncDb();
    const { createGoalPowerSyncModule } = await import('../server/infrastructure/powersync');
    expect(() => createGoalPowerSyncModule(db)).toThrow(/taskBindingReadPort/);
  });
});

describe('GoalElectronModule.register() lifecycle (W4 P2-1)', () => {
  it('actually registers IPC handlers and starts the module', async () => {
    const { createGoalElectronModule } = await import('./index');
    const db = createPowerSyncDb();
    const module = createGoalElectronModule({
      taskBindingReadPort: {
        checkActiveTaskBindings: async () => ({ hasActiveBindings: false, activeCount: 0 }),
      },
    });

    const ctx = {
      db,
      ipc: {},
    };
    expect(() => module.register(ctx as never)).not.toThrow();

    // IPC handlers were actually registered on the (mocked) ipcMain
    const { ipcMain } = await import('electron');
    expect((ipcMain.handle as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);

    module.destroy?.();
  });
});
