export const GOAL_RECORD_SOURCE_CORRELATION_INDEX =
  'goal_records_identity_id_source_type_source_id_key';

export interface GoalRecordSchemaQueryClient {
  query(sql: string): Promise<{
    rows: Array<Record<string, unknown>>;
    rowCount: number | null;
  }>;
}

export interface GoalRecordSourceCorrelationReport {
  tablePresent: boolean;
  indexPresent: boolean;
  indexCreated: boolean;
}

/**
 * Prepares the goal-record source correlation key before a migration-less
 * Prisma schema push. The new columns are nullable, so adding them preserves
 * existing manual records. Existing duplicate non-null source keys are a hard
 * failure because resolving them automatically would change business data.
 */
export async function prepareGoalRecordSourceCorrelation(
  client: GoalRecordSchemaQueryClient,
): Promise<GoalRecordSourceCorrelationReport> {
  const tableResult = await client.query(`SELECT to_regclass('public.goal_records') AS regclass`);
  const tablePresent = Boolean(tableResult.rows[0]?.regclass);

  if (!tablePresent) {
    return { tablePresent: false, indexPresent: false, indexCreated: false };
  }

  await client.query(`
    ALTER TABLE goal_records
      ADD COLUMN IF NOT EXISTS source_type TEXT,
      ADD COLUMN IF NOT EXISTS source_id TEXT
  `);

  const duplicateResult = await client.query(`
    SELECT identity_id, source_type, source_id, COUNT(*)::int AS duplicate_count
    FROM goal_records
    WHERE source_type IS NOT NULL AND source_id IS NOT NULL
    GROUP BY identity_id, source_type, source_id
    HAVING COUNT(*) > 1
    LIMIT 1
  `);
  const duplicate = duplicateResult.rows[0];

  if (duplicate) {
    throw new Error(
      `Cannot create goal-record source correlation key: duplicate source rows exist ` +
        `(identity_id=${String(duplicate.identity_id)}, source_type=${String(duplicate.source_type)}, ` +
        `source_id=${String(duplicate.source_id)}, count=${String(duplicate.duplicate_count)}).`,
    );
  }

  const beforeResult = await client.query(
    `SELECT to_regclass('public.${GOAL_RECORD_SOURCE_CORRELATION_INDEX}') AS regclass`,
  );
  const indexAlreadyPresent = Boolean(beforeResult.rows[0]?.regclass);

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "${GOAL_RECORD_SOURCE_CORRELATION_INDEX}"
    ON goal_records (identity_id, source_type, source_id)
  `);

  const afterResult = await client.query(
    `SELECT to_regclass('public.${GOAL_RECORD_SOURCE_CORRELATION_INDEX}') AS regclass`,
  );
  const indexPresent = Boolean(afterResult.rows[0]?.regclass);

  if (!indexPresent) {
    throw new Error('Goal-record source correlation index was not created.');
  }

  return {
    tablePresent: true,
    indexPresent: true,
    indexCreated: !indexAlreadyPresent,
  };
}
