import { describe, expect, it, vi } from 'vitest';
import {
  EDITOR_WORKSPACE_NATURAL_KEY_INDEX,
  prepareEditorWorkspaceNaturalKey,
  type SchemaQueryClient,
} from './editor-workspace-natural-key';

function result(rows: Array<Record<string, unknown>>) {
  return { rows, rowCount: rows.length };
}

describe('prepareEditorWorkspaceNaturalKey', () => {
  it('leaves a fresh database for Prisma to initialize', async () => {
    const query = vi.fn().mockResolvedValue(result([{ regclass: null }]));

    const report = await prepareEditorWorkspaceNaturalKey({ query } as SchemaQueryClient);

    expect(report).toEqual({
      tablePresent: false,
      indexPresent: false,
      indexCreated: false,
    });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('refuses to hide duplicate natural keys', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(result([{ regclass: 'editor_workspaces' }]))
      .mockResolvedValueOnce(
        result([{ identity_id: 'identity-1', project_path: 'repository-1', duplicate_count: 2 }]),
      );

    await expect(
      prepareEditorWorkspaceNaturalKey({ query } as SchemaQueryClient),
    ).rejects.toThrow(/duplicate identity\/project path rows exist/);
    expect(query.mock.calls.some(([sql]) => String(sql).includes('CREATE UNIQUE INDEX'))).toBe(
      false,
    );
  });

  it('creates and verifies the composite unique index idempotently', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(result([{ regclass: 'editor_workspaces' }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{ regclass: null }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{ regclass: EDITOR_WORKSPACE_NATURAL_KEY_INDEX }]));

    const report = await prepareEditorWorkspaceNaturalKey({ query } as SchemaQueryClient);

    expect(report).toEqual({ tablePresent: true, indexPresent: true, indexCreated: true });
    expect(
      query.mock.calls.some(
        ([sql]) =>
          String(sql).includes('CREATE UNIQUE INDEX IF NOT EXISTS') &&
          String(sql).includes('(identity_id, project_path)'),
      ),
    ).toBe(true);
  });
});
