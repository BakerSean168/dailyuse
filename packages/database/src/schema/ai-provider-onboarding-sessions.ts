export const AI_PROVIDER_ONBOARDING_SESSION_TABLE = 'ai_provider_onboarding_sessions';
export const AI_PROVIDER_ONBOARDING_IDENTITY_EXPIRY_INDEX =
  'ai_provider_onboarding_sessions_identity_id_expires_at_idx';
export const AI_PROVIDER_ONBOARDING_EXPIRY_INDEX =
  'ai_provider_onboarding_sessions_expires_at_idx';
export const AI_PROVIDER_ONBOARDING_IDENTITY_FK =
  'ai_provider_onboarding_sessions_identity_id_fkey';

export interface AIProviderOnboardingSchemaQueryClient {
  query(sql: string): Promise<{
    rows: Array<Record<string, unknown>>;
    rowCount: number | null;
  }>;
}

export interface AIProviderOnboardingSessionsReport {
  tablePresent: boolean;
  identityExpiryIndexPresent: boolean;
  expiryIndexPresent: boolean;
  identityForeignKeyPresent: boolean;
}

/**
 * Verifies and idempotently completes the durable API-lane Provider onboarding
 * session schema after Prisma reconciliation. This is intentionally a post-
 * reconciliation guard: a brand-new database may not have the accounts table
 * until `prisma db push`/`migrate deploy` has completed.
 */
export async function prepareAIProviderOnboardingSessions(
  client: AIProviderOnboardingSchemaQueryClient,
): Promise<AIProviderOnboardingSessionsReport> {
  const tableResult = await client.query(
    `SELECT to_regclass('public.${AI_PROVIDER_ONBOARDING_SESSION_TABLE}') AS regclass`,
  );
  if (!tableResult.rows[0]?.regclass) {
    return {
      tablePresent: false,
      identityExpiryIndexPresent: false,
      expiryIndexPresent: false,
      identityForeignKeyPresent: false,
    };
  }

  await client.query(`
    CREATE INDEX IF NOT EXISTS "${AI_PROVIDER_ONBOARDING_IDENTITY_EXPIRY_INDEX}"
    ON "${AI_PROVIDER_ONBOARDING_SESSION_TABLE}" ("identity_id", "expires_at")
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS "${AI_PROVIDER_ONBOARDING_EXPIRY_INDEX}"
    ON "${AI_PROVIDER_ONBOARDING_SESSION_TABLE}" ("expires_at")
  `);
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '${AI_PROVIDER_ONBOARDING_IDENTITY_FK}'
      ) THEN
        ALTER TABLE "${AI_PROVIDER_ONBOARDING_SESSION_TABLE}"
        ADD CONSTRAINT "${AI_PROVIDER_ONBOARDING_IDENTITY_FK}"
        FOREIGN KEY ("identity_id") REFERENCES "accounts"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  const [identityExpiryIndex, expiryIndex, foreignKey] = await Promise.all([
    client.query(
      `SELECT to_regclass('public.${AI_PROVIDER_ONBOARDING_IDENTITY_EXPIRY_INDEX}') AS regclass`,
    ),
    client.query(
      `SELECT to_regclass('public.${AI_PROVIDER_ONBOARDING_EXPIRY_INDEX}') AS regclass`,
    ),
    client.query(
      `SELECT 1 AS present FROM pg_constraint WHERE conname = '${AI_PROVIDER_ONBOARDING_IDENTITY_FK}' LIMIT 1`,
    ),
  ]);

  const report = {
    tablePresent: true,
    identityExpiryIndexPresent: Boolean(identityExpiryIndex.rows[0]?.regclass),
    expiryIndexPresent: Boolean(expiryIndex.rows[0]?.regclass),
    identityForeignKeyPresent: Boolean(foreignKey.rows[0]?.present),
  };

  if (
    !report.identityExpiryIndexPresent ||
    !report.expiryIndexPresent ||
    !report.identityForeignKeyPresent
  ) {
    throw new Error('AI Provider onboarding session schema preparation did not converge.');
  }

  return report;
}
