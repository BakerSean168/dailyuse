import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');

function loadEnvFile(filePath: string, override = true): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  expand(config({ path: filePath, override }));
}

export function loadWorkspaceEnv(nodeEnv = process.env.NODE_ENV || 'development'): void {
  const envFiles = [
    path.resolve(WORKSPACE_ROOT, '.env'),
    path.resolve(WORKSPACE_ROOT, `.env.${nodeEnv}`),
    path.resolve(WORKSPACE_ROOT, '.env.local'),
    path.resolve(WORKSPACE_ROOT, `.env.${nodeEnv}.local`),
  ];

  for (const envFile of envFiles) {
    loadEnvFile(envFile, true);
  }
}
