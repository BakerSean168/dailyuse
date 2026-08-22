import { Client } from 'pg';
import { loadWorkspaceEnv } from '../src/load-workspace-env';
import { errorMessage as toErrorMessage } from '@memoflow/utils/shared';

/**
 * AI-VNEXT-07 destructive migration for retired execution-engine state only.
 *
 * These tables belonged to the removed AgentHost/LangGraph runtimes. They do
 * not contain MemoFlow product facts (Goal/Task/Reminder/Knowledge/Provider).
 * The operation is intentionally idempotent so db-push based deployments can
 * retire the tables before Prisma reconciles the vNext schema without needing
 * --accept-data-loss in production.
 */
async function main(): Promise<void> {
  loadWorkspaceEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to retire legacy AI runtime state.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      DROP TABLE IF EXISTS "langgraph_checkpoint_writes";
      DROP TABLE IF EXISTS "langgraph_checkpoints";
      DROP TABLE IF EXISTS "agent_run_checkpoints";
    `);
    console.log('AI vNext runtime-state retirement: ready');
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(toErrorMessage(error));
  process.exitCode = 1;
});
