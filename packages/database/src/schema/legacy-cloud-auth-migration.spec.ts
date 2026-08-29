import { describe, expect, it, vi } from 'vitest';
import {
  prepareLegacyCloudAuthMigration,
  type LegacyCloudAuthSchemaQueryClient,
} from './legacy-cloud-auth-migration';

const LEGACY_TABLES = [
  'auth_identities',
  'auth_identifiers',
  'auth_credentials',
  'auth_oauth_bindings',
  'auth_sessions',
];

function normalized(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function fullLegacyClient(options: { liveSessions?: number } = {}) {
  const queries: string[] = [];
  const query = vi.fn(async (sql: string) => {
    const text = normalized(sql);
    queries.push(text);
    if (text.includes('FROM information_schema.tables')) {
      return { rows: LEGACY_TABLES.map((table_name) => ({ table_name })), rowCount: 5 };
    }
    if (text.includes("to_regclass('public.accounts')")) {
      return { rows: [{ present: true }], rowCount: 1 };
    }
    if (text.includes('FROM auth_sessions') && text.includes('expires_at > CURRENT_TIMESTAMP')) {
      return { rows: [{ count: String(options.liveSessions ?? 0) }], rowCount: 1 };
    }
    if (text === 'SELECT COUNT(*) AS count FROM auth_identities') {
      return { rows: [{ count: '1' }], rowCount: 1 };
    }
    if (text === 'SELECT COUNT(*) AS count FROM auth_credentials') {
      return { rows: [{ count: '1' }], rowCount: 1 };
    }
    if (text === 'SELECT COUNT(*) AS count FROM auth_oauth_bindings') {
      return { rows: [{ count: '0' }], rowCount: 1 };
    }
    if (text === 'SELECT COUNT(*) AS count FROM auth_sessions') {
      return { rows: [{ count: '2' }], rowCount: 1 };
    }
    if (text.includes('JOIN cloud_auth_users cloud_user')) {
      return { rows: [{ count: '1' }], rowCount: 1 };
    }
    if (
      text.includes('JOIN cloud_auth_provider_accounts provider') &&
      text.includes("provider.provider_id = 'credential'")
    ) {
      return { rows: [{ count: '1' }], rowCount: 1 };
    }
    if (
      text.includes('FROM auth_oauth_bindings binding') &&
      text.includes('JOIN cloud_auth_provider_accounts provider')
    ) {
      return { rows: [{ count: '0' }], rowCount: 1 };
    }
    if (text.includes('SELECT constraint_name')) {
      return { rows: [{ constraint_name: 'accounts_id_fkey' }], rowCount: 1 };
    }
    if (text.startsWith('SELECT COUNT(*) AS count')) {
      return { rows: [{ count: '0' }], rowCount: 1 };
    }
    return { rows: [], rowCount: null };
  });
  return { client: { query } as LegacyCloudAuthSchemaQueryClient, queries };
}

describe('prepareLegacyCloudAuthMigration', () => {
  it('is a no-op once the legacy authentication schema is absent', async () => {
    const query = vi.fn(async () => ({ rows: [], rowCount: 0 }));

    await expect(
      prepareLegacyCloudAuthMigration({ query } as LegacyCloudAuthSchemaQueryClient),
    ).resolves.toEqual({
      legacySchemaPresent: false,
      identitiesMigrated: 0,
      passwordCredentialsMigrated: 0,
      oauthBindingsMigrated: 0,
      expiredSessionsRetired: 0,
    });
  });

  it('backs up canonical identity/password state before retiring only expired legacy sessions', async () => {
    const fixture = fullLegacyClient();

    await expect(prepareLegacyCloudAuthMigration(fixture.client)).resolves.toEqual({
      legacySchemaPresent: true,
      identitiesMigrated: 1,
      passwordCredentialsMigrated: 1,
      oauthBindingsMigrated: 0,
      expiredSessionsRetired: 2,
    });

    expect(fixture.queries).toContain('ALTER TABLE accounts DROP CONSTRAINT "accounts_id_fkey"');
    expect(fixture.queries.slice(-6)).toEqual([
      'DROP TABLE auth_sessions',
      'DROP TABLE auth_credentials',
      'DROP TABLE auth_oauth_bindings',
      'DROP TABLE auth_identifiers',
      'DROP TABLE auth_identities',
      'COMMIT',
    ]);
  });

  it('fails closed before destructive retirement when any legacy session is still live', async () => {
    const fixture = fullLegacyClient({ liveSessions: 1 });

    await expect(prepareLegacyCloudAuthMigration(fixture.client)).rejects.toThrow(
      /refuses to invalidate 1 live session/,
    );
    expect(fixture.queries).toContain('ROLLBACK');
    expect(fixture.queries.some((query) => query.startsWith('DROP TABLE auth_'))).toBe(false);
  });

  it('fails closed for a partial legacy schema instead of guessing migration state', async () => {
    const query = vi.fn(async () => ({
      rows: LEGACY_TABLES.slice(0, -1).map((table_name) => ({ table_name })),
      rowCount: 4,
    }));

    await expect(
      prepareLegacyCloudAuthMigration({ query } as LegacyCloudAuthSchemaQueryClient),
    ).rejects.toThrow(/Partial legacy auth schema.*auth_sessions/);
  });
});
