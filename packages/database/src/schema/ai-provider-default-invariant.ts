export const AI_PROVIDER_DEFAULT_INVARIANT_INDEX =
  'ai_provider_configs_identity_one_live_default_key';

export interface AIProviderDefaultSchemaQueryClient {
  query(sql: string): Promise<{
    rows: Array<Record<string, unknown>>;
    rowCount: number | null;
  }>;
}

export interface AIProviderDefaultInvariantReport {
  tablePresent: boolean;
  indexPresent: boolean;
  indexCreated: boolean;
}

/**
 * Prisma cannot express this partial unique index. Keep it as an explicit,
 * idempotent database invariant rather than trusting application-level reads.
 */
export async function prepareAIProviderDefaultInvariant(
  client: AIProviderDefaultSchemaQueryClient,
): Promise<AIProviderDefaultInvariantReport> {
  const table = await client.query(`SELECT to_regclass('public.ai_provider_configs') AS regclass`);
  if (!table.rows[0]?.regclass) {
    return { tablePresent: false, indexPresent: false, indexCreated: false };
  }

  const duplicates = await client.query(`
    SELECT identity_id, COUNT(*)::int AS duplicate_count
    FROM ai_provider_configs
    WHERE is_default = TRUE AND deleted_at IS NULL
    GROUP BY identity_id
    HAVING COUNT(*) > 1
    LIMIT 1
  `);
  const duplicate = duplicates.rows[0];
  if (duplicate) {
    throw new Error(
      `Cannot create AI provider default invariant: duplicate default providers exist ` +
        `(identity_id=${String(duplicate.identity_id)}, count=${String(duplicate.duplicate_count)}).`,
    );
  }

  const before = await client.query(
    `SELECT to_regclass('public.${AI_PROVIDER_DEFAULT_INVARIANT_INDEX}') AS regclass`,
  );
  const indexAlreadyPresent = Boolean(before.rows[0]?.regclass);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "${AI_PROVIDER_DEFAULT_INVARIANT_INDEX}"
    ON ai_provider_configs (identity_id)
    WHERE is_default = TRUE AND deleted_at IS NULL
  `);
  const after = await client.query(
    `SELECT to_regclass('public.${AI_PROVIDER_DEFAULT_INVARIANT_INDEX}') AS regclass`,
  );
  if (!after.rows[0]?.regclass) {
    throw new Error('AI provider default invariant index was not created.');
  }

  return { tablePresent: true, indexPresent: true, indexCreated: !indexAlreadyPresent };
}
