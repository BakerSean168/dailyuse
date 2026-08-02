import { Client } from 'pg';
import { errorMessage as toErrorMessage } from '@memoflow/utils/shared';
import { loadWorkspaceEnv } from '../src/load-workspace-env';
import { prepareAIProviderDefaultInvariant } from '../src/schema/ai-provider-default-invariant';

async function main(): Promise<void> {
  loadWorkspaceEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for AI provider default invariant preparation.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const report = await prepareAIProviderDefaultInvariant(client);
    console.log(
      report.tablePresent
        ? `AI provider default invariant: ${report.indexCreated ? 'created' : 'already present'}`
        : 'AI provider configs table is not present; Prisma will initialize it.',
    );
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(toErrorMessage(error));
  process.exitCode = 1;
});
