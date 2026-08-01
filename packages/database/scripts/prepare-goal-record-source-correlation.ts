import { Client } from 'pg';
import { errorMessage as toErrorMessage } from '@memoflow/utils/shared';
import { loadWorkspaceEnv } from '../src/load-workspace-env';
import { prepareGoalRecordSourceCorrelation } from '../src/schema/goal-record-source-correlation';

async function main(): Promise<void> {
  loadWorkspaceEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for goal-record source correlation preparation.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const report = await prepareGoalRecordSourceCorrelation(client);
    if (!report.tablePresent) {
      console.log(
        'Goal records table is not present; Prisma will create the source correlation key.',
      );
    } else {
      console.log(
        `Goal-record source correlation key: ${report.indexCreated ? 'created' : 'already present'}`,
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
