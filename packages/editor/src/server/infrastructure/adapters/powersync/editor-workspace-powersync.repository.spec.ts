import { describe, expect, it } from 'vitest';
import type {
  IElectronDatabase,
  IElectronDatabaseQueryResult,
  IElectronDatabaseTransaction,
} from '@dailyuse/contracts/electron';
import { ProjectType } from '@dailyuse/contracts/editor';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { EditorWorkspace } from '../../../domain/aggregates/editor-workspace';
import type { PowerSyncEditorWorkspaceRow } from './mappers/powersync-editor-workspace.mapper';
import { PowerSyncEditorWorkspaceRepository } from './editor-workspace-powersync.repository';

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

describe('PowerSyncEditorWorkspaceRepository.createOrGet', () => {
  it('serializes concurrent natural-key creation and returns the persisted id', async () => {
    const database = new SerializedWorkspaceDatabase();
    const repository = new PowerSyncEditorWorkspaceRepository(database);
    const identityId = IdentityId.generate();
    const candidates = Array.from({ length: 10 }, (_, index) =>
      EditorWorkspace.create({
        identityId,
        name: `Desktop candidate ${index}`,
        projectPath: 'repository-1',
        projectType: ProjectType.Other,
      }),
    );

    const results = await Promise.all(
      candidates.map((candidate) => repository.createOrGet(candidate)),
    );

    expect(database.insertCount).toBe(1);
    expect(new Set(results.map((workspace) => workspace.id))).toEqual(
      new Set([results[0]?.id]),
    );
    expect(results[0]?.id).toBe(candidates[0]?.id);
  });
});
