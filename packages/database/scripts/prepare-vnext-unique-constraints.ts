import { Client } from 'pg';
import { errorMessage as toErrorMessage } from '@memoflow/utils/shared';
import { loadWorkspaceEnv } from '../src/load-workspace-env';
import { prepareVnextUniqueConstraints } from '../src/schema/vnext-unique-constraints';

async function main(): Promise<void> {
  loadWorkspaceEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for vNext uniqueness preparation.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const report = await prepareVnextUniqueConstraints(client);
    console.log(
      `vNext uniqueness guard: created ${report.created.length}, existing ${report.existing.length}, ` +
        `added ${report.addedEmptyTableColumns.length} empty-table column(s), ` +
        `deferred ${report.skippedMissingTables.length} missing table(s).`,
    );
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(toErrorMessage(error));
  process.exitCode = 1;
});
