import path from 'node:path';
import { loadWorkspaceEnv } from './_shared/load-workspace-env.js';
import { buildProfileSnapshot } from '../src/modules/powersync/snapshot-builder.js';

interface CliOptions {
  identityId: string | null;
  version: string;
  generatedAt: string | null;
  snapshotRootDir: string | null;
  tempRootDir: string | null;
  syncWaitTimeoutMs: number | null;
  tokenExpiresInSeconds: number | null;
  json: boolean;
  help: boolean;
}

function parseIntegerOption(raw: string | undefined, flag: string): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

function parseArgs(argv: string[]): CliOptions {
  let identityId: string | null = null;
  let version = new Date().toISOString();
  let generatedAt: string | null = null;
  let snapshotRootDir: string | null = null;
  let tempRootDir: string | null = null;
  let syncWaitTimeoutMs: number | null = null;
  let tokenExpiresInSeconds: number | null = null;
  let json = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case '--identity-id':
        identityId = next ?? null;
        index += 1;
        break;
      case '--version':
        version = next ?? version;
        index += 1;
        break;
      case '--generated-at':
        generatedAt = next ?? null;
        index += 1;
        break;
      case '--snapshot-root-dir':
        snapshotRootDir = next ?? null;
        index += 1;
        break;
      case '--temp-root-dir':
        tempRootDir = next ?? null;
        index += 1;
        break;
      case '--sync-wait-timeout-ms':
        syncWaitTimeoutMs = parseIntegerOption(next, '--sync-wait-timeout-ms');
        index += 1;
        break;
      case '--token-expires-in-seconds':
        tokenExpiresInSeconds = parseIntegerOption(next, '--token-expires-in-seconds');
        index += 1;
        break;
      case '--json':
        json = true;
        break;
      case '--help':
      case '-h':
        help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return {
    identityId,
    version,
    generatedAt,
    snapshotRootDir,
    tempRootDir,
    syncWaitTimeoutMs,
    tokenExpiresInSeconds,
    json,
    help,
  };
}

function printUsage(): void {
  console.log(`Usage: tsx apps/api/scripts/build-powersync-profile-snapshot.ts --identity-id <identityId> [options]

Options:
  --identity-id <value>            Required. Identity ID that owns this snapshot.
  --version <value>                Optional. Snapshot version. Defaults to current ISO timestamp.
  --generated-at <value>           Optional. Override manifest generatedAt timestamp.
  --snapshot-root-dir <path>       Optional. Overrides POWERSYNC_SNAPSHOT_DIR.
  --temp-root-dir <path>           Optional. Builder temp directory. Defaults to OS temp.
  --sync-wait-timeout-ms <value>   Optional. Wait timeout for first sync. Defaults to 120000.
  --token-expires-in-seconds <v>   Optional. Internal PowerSync JWT lifetime. Defaults to 300.
  --json                           Print the build result as JSON.
  --help, -h                       Show this help message.
`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  loadWorkspaceEnv();
  const { env, getPowerSyncConfig } = await import('../src/shared/infrastructure/config/env.js');
  const powerSyncConfig = getPowerSyncConfig();

  if (!options.identityId) {
    throw new Error('--identity-id is required.');
  }

  const snapshotRootDir = options.snapshotRootDir ?? env.POWERSYNC_SNAPSHOT_DIR;
  if (!snapshotRootDir) {
    throw new Error(
      'POWERSYNC_SNAPSHOT_DIR is not configured. Pass --snapshot-root-dir or set the env var.',
    );
  }

  if (!powerSyncConfig.url) {
    throw new Error('POWERSYNC_URL is not configured.');
  }

  if (!powerSyncConfig.privateKey) {
    throw new Error('POWERSYNC_PRIVATE_KEY is not configured.');
  }

  const result = await buildProfileSnapshot({
    identityId: options.identityId,
    snapshotRootDir,
    powersyncUrl: powerSyncConfig.url,
    privateKey: powerSyncConfig.privateKey,
    keyId: powerSyncConfig.keyId,
    version: options.version,
    generatedAt: options.generatedAt ?? undefined,
    tempRootDir: options.tempRootDir ? path.resolve(options.tempRootDir) : undefined,
    syncWaitTimeoutMs: options.syncWaitTimeoutMs ?? undefined,
    tokenExpiresInSeconds: options.tokenExpiresInSeconds ?? undefined,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Snapshot built for ${options.identityId}`);
  console.log(`- snapshotKey: ${result.snapshotKey}`);
  console.log(`- databasePath: ${result.databasePath}`);
  console.log(`- manifestPath: ${result.manifestPath}`);
  console.log(`- version: ${result.manifest.version}`);
  console.log(`- checksumSha256: ${result.manifest.checksumSha256}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
