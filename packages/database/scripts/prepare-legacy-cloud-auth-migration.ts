import { Client } from 'pg';
import { errorMessage as toErrorMessage } from '@memoflow/utils/shared';
import { loadWorkspaceEnv } from '../src/load-workspace-env';
import { prepareLegacyCloudAuthMigration } from '../src/schema/legacy-cloud-auth-migration';

async function main(): Promise<void> {
  loadWorkspaceEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for legacy cloud auth migration preparation.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const report = await prepareLegacyCloudAuthMigration(client);
    if (!report.legacySchemaPresent) {
      console.log('Legacy authentication schema is not present; Better Auth migration is ready.');
      return;
    }
    console.log(
      `Legacy authentication migration: ${report.identitiesMigrated} identity(s), ` +
        `${report.passwordCredentialsMigrated} password credential(s), ` +
        `${report.oauthBindingsMigrated} OAuth binding(s); ` +
        `${report.expiredSessionsRetired} expired/deleted legacy session(s) retired.`,
    );
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(toErrorMessage(error));
  process.exitCode = 1;
});
