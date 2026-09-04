import { Client } from 'pg';
import { errorMessage as toErrorMessage } from '@memoflow/utils/shared';
import { loadWorkspaceEnv } from '../src/load-workspace-env';
import { prepareAIProviderOnboardingSessions } from '../src/schema/ai-provider-onboarding-sessions';

async function main(): Promise<void> {
  loadWorkspaceEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for AI Provider onboarding session preparation.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const report = await prepareAIProviderOnboardingSessions(client);
    console.log(
      report.tablePresent
        ? 'AI Provider onboarding session schema: ready'
        : 'AI Provider onboarding session table is not present; Prisma reconciliation must create it.',
    );
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(toErrorMessage(error));
  process.exitCode = 1;
});
