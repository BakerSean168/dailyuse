import { Client } from 'pg';
import { errorMessage as toErrorMessage } from '@memoflow/utils/shared';
import { loadWorkspaceEnv } from '../src/load-workspace-env';
import { prepareNotificationPreferenceHierarchy } from '../src/schema/notification-preference-hierarchy';

async function main(): Promise<void> {
  loadWorkspaceEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for notification preference hierarchy preparation.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const report = await prepareNotificationPreferenceHierarchy(client);
    if (!report.tablePresent) {
      console.log(
        'Notification preferences table is not present; Prisma will create the vNext hierarchy.',
      );
    } else {
      console.log(
        `Notification preference hierarchy: migrated ${report.rowsMigrated}/${report.rowsScanned} legacy row(s).`,
      );
    }
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(toErrorMessage(error));
  process.exitCode = 1;
});
