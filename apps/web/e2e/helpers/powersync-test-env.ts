import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');
const developmentEnvPath = path.join(workspaceRoot, '.env.development');

const DEFAULT_TEST_POWERSYNC_PORT = '58082';
const REQUIRED_SIGNING_KEYS = [
  'POWERSYNC_PRIVATE_KEY',
  'POWERSYNC_PUBLIC_KEY_N',
  'POWERSYNC_PUBLIC_KEY_E',
  'POWERSYNC_KEY_ID',
] as const;

export function configurePowerSyncTestEnv(): void {
  const developmentEnv = existsSync(developmentEnvPath)
    ? parse(readFileSync(developmentEnvPath))
    : {};

  process.env.TEST_POWERSYNC_PORT ??= DEFAULT_TEST_POWERSYNC_PORT;
  process.env.POWERSYNC_URL ??= `http://127.0.0.1:${process.env.TEST_POWERSYNC_PORT}`;

  for (const key of REQUIRED_SIGNING_KEYS) {
    process.env[key] ??= developmentEnv[key];
    if (!process.env[key]) {
      throw new Error(
        `Authenticated sync E2E requires ${key}. Set it in the environment or ${developmentEnvPath}.`,
      );
    }
  }
}
