export interface LegacyCloudAuthSchemaQueryClient {
  query(
    sql: string,
    values?: readonly unknown[],
  ): Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>;
}

export interface LegacyCloudAuthMigrationReport {
  legacySchemaPresent: boolean;
  identitiesMigrated: number;
  passwordCredentialsMigrated: number;
  oauthBindingsMigrated: number;
  expiredSessionsRetired: number;
}

const LEGACY_TABLES = [
  'auth_identities',
  'auth_identifiers',
  'auth_credentials',
  'auth_oauth_bindings',
  'auth_sessions',
] as const;

function countFrom(row: Record<string, unknown> | undefined, field = 'count'): number {
  const value = row?.[field];
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid legacy cloud auth migration count for ${field}`);
  }
  return parsed;
}

async function scalarCount(
  client: LegacyCloudAuthSchemaQueryClient,
  sql: string,
  values?: readonly unknown[],
): Promise<number> {
  const result = await client.query(sql, values);
  return countFrom(result.rows[0]);
}

async function assertNoRows(
  client: LegacyCloudAuthSchemaQueryClient,
  sql: string,
  message: string,
): Promise<void> {
  const count = await scalarCount(client, sql);
  if (count !== 0) throw new Error(`${message}: ${count} row(s)`);
}

/**
 * Backfill the retired AuthIdentity model into Better Auth before migration-less
 * Prisma `db push` is allowed to remove the legacy tables.
 *
 * Safety invariants:
 * - Account.id remains the cloud identity id.
 * - Exactly one matching EMAIL identifier must exist for every legacy identity.
 * - Only active Password credentials and GitHub OAuth bindings are migrated.
 * - Legacy sessions are not token-compatible with Better Auth. The migration
 *   therefore refuses to proceed while any non-deleted, non-expired session exists.
 * - Target rows are verified before the legacy schema is retired.
 *
 * The function is idempotent after successful migration because all legacy auth
 * tables are removed. A partial target table is accepted only when the migrated
 * rows agree with the legacy source; conflicting rows fail closed.
 */
export async function prepareLegacyCloudAuthMigration(
  client: LegacyCloudAuthSchemaQueryClient,
): Promise<LegacyCloudAuthMigrationReport> {
  const tableRows = await client.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
  `,
    [LEGACY_TABLES],
  );
  const present = new Set(tableRows.rows.map((row) => String(row.table_name)));

  if (present.size === 0) {
    return {
      legacySchemaPresent: false,
      identitiesMigrated: 0,
      passwordCredentialsMigrated: 0,
      oauthBindingsMigrated: 0,
      expiredSessionsRetired: 0,
    };
  }

  const missing = LEGACY_TABLES.filter((table) => !present.has(table));
  if (missing.length > 0) {
    throw new Error(`Partial legacy auth schema detected; missing table(s): ${missing.join(', ')}`);
  }

  const accountsPresent = await client.query(
    `SELECT to_regclass('public.accounts') IS NOT NULL AS present`,
  );
  if (accountsPresent.rows[0]?.present !== true) {
    throw new Error('Legacy auth migration requires the accounts table');
  }

  await client.query('BEGIN');
  try {
    // Prevent authentication rows from changing between validation, backfill and retirement.
    await client.query(`
      LOCK TABLE auth_identities, auth_identifiers, auth_credentials,
                 auth_oauth_bindings, auth_sessions, accounts
      IN SHARE ROW EXCLUSIVE MODE
    `);

    await assertNoRows(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_identities identity
       LEFT JOIN accounts account ON account.id = identity.id
       WHERE account.id IS NULL`,
      'Legacy auth identity without a matching MemoFlow Account',
    );
    await assertNoRows(
      client,
      `SELECT COUNT(*) AS count
       FROM (
         SELECT identity.id
         FROM auth_identities identity
         LEFT JOIN auth_identifiers identifier
           ON identifier.identity_id = identity.id AND UPPER(identifier.type) = 'EMAIL'
         GROUP BY identity.id
         HAVING COUNT(identifier.id) <> 1
       ) invalid_email_identity`,
      'Legacy auth identity must have exactly one EMAIL identifier',
    );
    await assertNoRows(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_identities identity
       JOIN accounts account ON account.id = identity.id
       JOIN auth_identifiers identifier
         ON identifier.identity_id = identity.id AND UPPER(identifier.type) = 'EMAIL'
       WHERE LOWER(identifier.value) <> LOWER(account.email_address)`,
      'Legacy auth EMAIL identifier disagrees with MemoFlow Account email',
    );
    await assertNoRows(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_identities
       WHERE status NOT IN ('Active', 'Unverified', 'Disabled', 'Locked')`,
      'Unsupported legacy auth identity status',
    );
    await assertNoRows(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_credentials
       WHERE UPPER(type) <> 'PASSWORD'
          OR status <> 'Active'
          OR password_hash IS NULL
          OR deleted_at IS NOT NULL`,
      'Unsupported or inactive legacy credential cannot be migrated safely',
    );
    await assertNoRows(
      client,
      `SELECT COUNT(*) AS count
       FROM (
         SELECT identity_id
         FROM auth_credentials
         GROUP BY identity_id
         HAVING COUNT(*) > 1
       ) duplicate_password_identity`,
      'Legacy auth identity has multiple credentials',
    );
    await assertNoRows(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_oauth_bindings
       WHERE UPPER(provider) <> 'GITHUB'`,
      'Unsupported legacy OAuth provider cannot be migrated safely',
    );

    const liveSessions = await scalarCount(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_sessions
       WHERE deleted_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
    );
    if (liveSessions > 0) {
      throw new Error(
        `Legacy auth migration refuses to invalidate ${liveSessions} live session(s); revoke or expire them explicitly first`,
      );
    }

    const identityCount = await scalarCount(
      client,
      `SELECT COUNT(*) AS count FROM auth_identities`,
    );
    const credentialCount = await scalarCount(
      client,
      `SELECT COUNT(*) AS count FROM auth_credentials`,
    );
    const oauthCount = await scalarCount(
      client,
      `SELECT COUNT(*) AS count FROM auth_oauth_bindings`,
    );
    const sessionCount = await scalarCount(client, `SELECT COUNT(*) AS count FROM auth_sessions`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cloud_auth_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        disabled_at TIMESTAMP(3),
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL
      )
    `);
    await client.query(`
      ALTER TABLE cloud_auth_users
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP(3)
    `);
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS cloud_auth_users_email_key ON cloud_auth_users(email)`,
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS cloud_auth_provider_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at TIMESTAMP(3),
        refresh_token_expires_at TIMESTAMP(3),
        scope TEXT,
        password TEXT,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL
      )
    `);
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS cloud_auth_provider_accounts_provider_id_account_id_key
       ON cloud_auth_provider_accounts(provider_id, account_id)`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS cloud_auth_provider_accounts_user_id_idx
       ON cloud_auth_provider_accounts(user_id)`,
    );

    await client.query(`
      INSERT INTO cloud_auth_users (
        id, name, email, email_verified, image, status, disabled_at, created_at, updated_at
      )
      SELECT
        account.id,
        COALESCE(
          NULLIF(BTRIM(account.profile ->> 'nickname'), ''),
          NULLIF(SPLIT_PART(account.email_address, '@', 1), ''),
          'MemoFlow user'
        ),
        account.email_address,
        (account.email_is_verified OR identifier.is_verified),
        NULLIF(account.profile ->> 'avatarUrl', ''),
        CASE
          WHEN identity.status IN ('Disabled', 'Locked') THEN 'disabled'
          ELSE 'active'
        END,
        CASE
          WHEN identity.status IN ('Disabled', 'Locked')
            THEN COALESCE(identity.deleted_at, identity.locked_until, identity.updated_at)
          ELSE NULL
        END,
        identity.created_at,
        identity.updated_at
      FROM auth_identities identity
      JOIN accounts account ON account.id = identity.id
      JOIN auth_identifiers identifier
        ON identifier.identity_id = identity.id AND UPPER(identifier.type) = 'EMAIL'
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO cloud_auth_provider_accounts (
        id, user_id, account_id, provider_id, access_token, refresh_token, id_token,
        access_token_expires_at, refresh_token_expires_at, scope, password,
        created_at, updated_at
      )
      SELECT
        credential.id,
        credential.identity_id,
        credential.identity_id,
        'credential',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        credential.password_hash,
        credential.created_at,
        COALESCE(
          credential.password_last_changed_at,
          credential.last_used_at,
          credential.created_at
        )
      FROM auth_credentials credential
      ON CONFLICT (provider_id, account_id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO cloud_auth_provider_accounts (
        id, user_id, account_id, provider_id, access_token, refresh_token, id_token,
        access_token_expires_at, refresh_token_expires_at, scope, password,
        created_at, updated_at
      )
      SELECT
        binding.id,
        binding.identity_id,
        binding.provider_subject_id,
        LOWER(binding.provider),
        binding.access_token,
        binding.refresh_token,
        NULL,
        binding.expires_at,
        NULL,
        NULL,
        NULL,
        binding.created_at,
        COALESCE(binding.last_used_at, binding.created_at)
      FROM auth_oauth_bindings binding
      ON CONFLICT (provider_id, account_id) DO NOTHING
    `);

    const migratedUsers = await scalarCount(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_identities identity
       JOIN cloud_auth_users cloud_user ON cloud_user.id = identity.id
       JOIN accounts account ON account.id = identity.id
       JOIN auth_identifiers identifier
         ON identifier.identity_id = identity.id AND UPPER(identifier.type) = 'EMAIL'
       WHERE LOWER(cloud_user.email) = LOWER(account.email_address)
         AND cloud_user.email_verified = (account.email_is_verified OR identifier.is_verified)
         AND cloud_user.status = CASE
           WHEN identity.status IN ('Disabled', 'Locked') THEN 'disabled'
           ELSE 'active'
         END`,
    );
    if (migratedUsers !== identityCount) {
      throw new Error(
        `Legacy auth user backfill verification failed: expected ${identityCount}, verified ${migratedUsers}`,
      );
    }

    const migratedCredentials = await scalarCount(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_credentials credential
       JOIN cloud_auth_provider_accounts provider
         ON provider.user_id = credential.identity_id
        AND provider.account_id = credential.identity_id
        AND provider.provider_id = 'credential'
       WHERE provider.password = credential.password_hash`,
    );
    if (migratedCredentials !== credentialCount) {
      throw new Error(
        `Legacy password credential backfill verification failed: expected ${credentialCount}, verified ${migratedCredentials}`,
      );
    }

    const migratedOauth = await scalarCount(
      client,
      `SELECT COUNT(*) AS count
       FROM auth_oauth_bindings binding
       JOIN cloud_auth_provider_accounts provider
         ON provider.user_id = binding.identity_id
        AND provider.account_id = binding.provider_subject_id
        AND provider.provider_id = LOWER(binding.provider)`,
    );
    if (migratedOauth !== oauthCount) {
      throw new Error(
        `Legacy OAuth binding backfill verification failed: expected ${oauthCount}, verified ${migratedOauth}`,
      );
    }

    // The Account relation used to reference AuthIdentity with ON DELETE CASCADE.
    // Remove only that FK after every account-backed identity has a verified target row.
    const accountForeignKeys = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints constraint_info
      JOIN information_schema.constraint_column_usage usage_info
        USING (constraint_catalog, constraint_schema, constraint_name)
      WHERE constraint_info.table_schema = 'public'
        AND constraint_info.table_name = 'accounts'
        AND constraint_info.constraint_type = 'FOREIGN KEY'
        AND usage_info.table_schema = 'public'
        AND usage_info.table_name = 'auth_identities'
    `);
    for (const row of accountForeignKeys.rows) {
      const constraintName = String(row.constraint_name);
      if (!/^[A-Za-z0-9_]+$/.test(constraintName)) {
        throw new Error('Unsafe legacy account/auth foreign-key name');
      }
      await client.query(`ALTER TABLE accounts DROP CONSTRAINT "${constraintName}"`);
    }

    // All legacy sessions are expired/deleted by invariant above and cannot be
    // translated because the old store persists only refresh-token hashes.
    await client.query('DROP TABLE auth_sessions');
    await client.query('DROP TABLE auth_credentials');
    await client.query('DROP TABLE auth_oauth_bindings');
    await client.query('DROP TABLE auth_identifiers');
    await client.query('DROP TABLE auth_identities');

    await client.query('COMMIT');
    return {
      legacySchemaPresent: true,
      identitiesMigrated: identityCount,
      passwordCredentialsMigrated: credentialCount,
      oauthBindingsMigrated: oauthCount,
      expiredSessionsRetired: sessionCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
