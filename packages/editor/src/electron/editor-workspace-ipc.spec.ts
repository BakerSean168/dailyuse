import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectType } from '@dailyuse/contracts/editor';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  EditorChannels,
  type IElectronDatabase,
  type IElectronDatabaseQueryResult,
  type IElectronDatabaseTransaction,
  type IElectronModuleContext,
} from '@dailyuse/contracts/electron';
import type { PowerSyncEditorWorkspaceRow } from '../server/infrastructure/adapters/powersync/mappers/powersync-editor-workspace.mapper';
import { createEditorElectronModule } from './index';

const electronMock = vi.hoisted(() => ({
  handle: vi.fn(),
  removeHandler: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: electronMock.handle,
    removeHandler: electronMock.removeHandler,
  },
}));

class SerializedWorkspaceDatabase implements IElectronDatabase {
  private row: PowerSyncEditorWorkspaceRow | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  insertCount = 0;

  async writeTransaction<T>(
    callback: (tx: IElectronDatabaseTransaction) => Promise<T>,
  ): Promise<T> {
    const run = this.queue.then(() => callback(this));
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async execute(sql: string, parameters: unknown[] = []): Promise<IElectronDatabaseQueryResult> {
    if (!sql.includes('INSERT INTO editor_workspaces')) {
      return { rowsAffected: 0 };
    }

    this.insertCount += 1;
    this.row = {
      id: String(parameters[0]),
      identity_id: String(parameters[1]),
      name: String(parameters[2]),
      description: parameters[3] === null ? null : String(parameters[3]),
      project_path: String(parameters[4]),
      project_type: String(parameters[5]),
      layout: String(parameters[6]),
      setting: String(parameters[7]),
      is_active: Number(parameters[8]),
      version: Number(parameters[9]),
      created_at: String(parameters[10]),
      updated_at: String(parameters[11]),
      accessed_at: parameters[12] === null ? null : String(parameters[12]),
      deleted_at: parameters[13] === null ? null : String(parameters[13]),
    };
    return { rowsAffected: 1 };
  }

  async getAll<T>(): Promise<T[]> {
    return this.row ? [this.row as T] : [];
  }

  async getOptional<T>(_sql: string, parameters: unknown[] = []): Promise<T | null> {
    if (
      this.row &&
      this.row.identity_id === parameters[0] &&
      this.row.project_path === parameters[1]
    ) {
      return this.row as T;
    }
    return null;
  }

  async get<T>(sql: string, parameters: unknown[] = []): Promise<T> {
    const row = await this.getOptional<T>(sql, parameters);
    if (!row) throw new Error('Expected persisted editor workspace row');
    return row;
  }
}

function getHandler(channel: string) {
  const registration = electronMock.handle.mock.calls.find(
    ([registeredChannel]) => registeredChannel === channel,
  );
  expect(registration, `Expected handler for ${channel}`).toBeTruthy();
  return registration![1] as (_event: unknown, payload: unknown) => Promise<unknown>;
}

describe('Editor workspace Desktop IPC integration', () => {
  const module = createEditorElectronModule({
    contentPort: {
      getContent: vi.fn(),
      saveContent: vi.fn(),
    },
    searchPort: {
      search: vi.fn(),
    },
  });

  beforeEach(() => {
    electronMock.handle.mockClear();
    electronMock.removeHandler.mockClear();
  });

  afterEach(() => {
    module.destroy?.();
  });

  it('returns one persisted PowerSync workspace id to concurrent IPC callers', async () => {
    const database = new SerializedWorkspaceDatabase();
    const identityId = IdentityId.generate();
    const context = {
      db: database,
      auth: {
        requireRequestContext: vi.fn(async () => ({
          identityId,
          sessionId: 'session-editor-ipc',
          accountUuid: identityId,
        })),
      },
    } as unknown as IElectronModuleContext;

    module.register(context);
    const createWorkspace = getHandler(EditorChannels.WORKSPACE_CREATE);
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        createWorkspace({}, {
          name: `Concurrent IPC candidate ${index}`,
          projectPath: 'repository-editor-ipc',
          projectType: ProjectType.Other,
        }),
      ),
    );

    expect(database.insertCount).toBe(1);
    expect(results.every((result) => (result as { ok: boolean }).ok)).toBe(true);
    expect(
      new Set(results.map((result) => (result as { data: { id: string } }).data.id)).size,
    ).toBe(1);
    expect(context.auth.requireRequestContext).toHaveBeenCalledTimes(12);
  });
});
