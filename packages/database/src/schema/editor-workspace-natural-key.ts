export const EDITOR_WORKSPACE_NATURAL_KEY_INDEX =
  'editor_workspaces_identity_id_project_path_key';

export interface SchemaQueryClient {
  query(sql: string): Promise<{
    rows: Array<Record<string, unknown>>;
    rowCount: number | null;
  }>;
}

export interface EditorWorkspaceNaturalKeyReport {
  tablePresent: boolean;
  indexPresent: boolean;
  indexCreated: boolean;
}

/**
 * Prepares the editor workspace natural key before a migration-less Prisma
 * schema push. Existing duplicate keys are a hard failure: choosing or deleting
 * one of those rows would hide corrupted persistence state.
 */
export async function prepareEditorWorkspaceNaturalKey(
  client: SchemaQueryClient,
): Promise<EditorWorkspaceNaturalKeyReport> {
  const tableResult = await client.query(
    `SELECT to_regclass('public.editor_workspaces') AS regclass`,
  );
  const tablePresent = Boolean(tableResult.rows[0]?.regclass);

  if (!tablePresent) {
    return {
      tablePresent: false,
      indexPresent: false,
      indexCreated: false,
    };
  }

  const duplicateResult = await client.query(`
    SELECT identity_id, project_path, COUNT(*)::int AS duplicate_count
    FROM editor_workspaces
    GROUP BY identity_id, project_path
    HAVING COUNT(*) > 1
    LIMIT 1
  `);
  const duplicate = duplicateResult.rows[0];

  if (duplicate) {
    throw new Error(
      `Cannot create editor workspace natural key: duplicate identity/project path rows exist ` +
        `(identity_id=${String(duplicate.identity_id)}, project_path=${String(duplicate.project_path)}, ` +
        `count=${String(duplicate.duplicate_count)}).`,
    );
  }

  const beforeResult = await client.query(
    `SELECT to_regclass('public.${EDITOR_WORKSPACE_NATURAL_KEY_INDEX}') AS regclass`,
  );
  const indexAlreadyPresent = Boolean(beforeResult.rows[0]?.regclass);

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "${EDITOR_WORKSPACE_NATURAL_KEY_INDEX}"
    ON editor_workspaces (identity_id, project_path)
  `);

  const afterResult = await client.query(
    `SELECT to_regclass('public.${EDITOR_WORKSPACE_NATURAL_KEY_INDEX}') AS regclass`,
  );
  const indexPresent = Boolean(afterResult.rows[0]?.regclass);

  if (!indexPresent) {
    throw new Error('Editor workspace natural-key index was not created.');
  }

  return {
    tablePresent: true,
    indexPresent: true,
    indexCreated: !indexAlreadyPresent,
  };
}
