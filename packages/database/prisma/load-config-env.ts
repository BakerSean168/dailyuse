import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const prismaDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(prismaDirectory, '../../..');

/**
 * Load the same workspace env-file precedence used by database scripts without
 * importing package source into the deployed Prisma CLI boundary.
 */
export function loadPrismaConfigEnv(nodeEnv = process.env.NODE_ENV || 'development'): void {
  const preservedEnvironment = { ...process.env };
  const envFilesByPriority = [
    resolve(workspaceRoot, `.env.${nodeEnv}.local`),
    resolve(workspaceRoot, '.env.local'),
    resolve(workspaceRoot, `.env.${nodeEnv}`),
    resolve(workspaceRoot, '.env'),
  ];

  for (const envFile of envFilesByPriority) {
    if (existsSync(envFile)) {
      loadEnvFile(envFile);
    }
  }

  Object.assign(process.env, preservedEnvironment);
}
