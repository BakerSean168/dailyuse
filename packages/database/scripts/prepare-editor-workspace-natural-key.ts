import { Client } from 'pg';
import { loadWorkspaceEnv } from '../src/load-workspace-env';
// Residual 1019: sole errorMessage (local toErrorMessage dual retired).
import { errorMessage as toErrorMessage } from '@memoflow/utils/shared';
import { prepareEditorWorkspaceNaturalKey } from '../src/schema/editor-workspace-natural-key';


async function main(): Promise<void> {
  loadWorkspaceEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for editor workspace natural-key preparation.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const report = await prepareEditorWorkspaceNaturalKey(client);
    if (!report.tablePresent) {
      console.log('Editor workspace table is not present; Prisma will create the natural key.');
    } else {
      console.log(
        `Editor workspace natural key: ${report.indexCreated ? 'created' : 'already present'}`,
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
