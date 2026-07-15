import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  getRuntimeProfile,
  resolveLocalDockerHostPorts,
} from '../runtime/load-profiles.mjs';

const command = process.argv[2] ?? 'up';
const envFile = '.env.production.local';
const composeArgs = ['compose', '-f', 'docker-compose.local.yml', '--env-file', envFile];

function readEnvFileMap(path) {
  if (!existsSync(path)) {
    return new Map();
  }

  const values = new Map();
  const lines = readFileSync(path, 'utf8').split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/\s+#.*$/u, '').trim();

    values.set(key, value);
  }

  return values;
}

function readEnvFileKeys(path) {
  return new Set(readEnvFileMap(path).keys());
}

function run(bin, args, env) {
  const shouldUseCmdShim =
    process.platform === 'win32' && /\.(cmd|bat)$/iu.test(bin);
  const spawnCommand = shouldUseCmdShim ? 'cmd.exe' : bin;
  const spawnArgs = shouldUseCmdShim ? ['/d', '/s', '/c', bin, ...args] : args;

  const result = spawnSync(spawnCommand, spawnArgs, {
    stdio: 'inherit',
    env,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function readGitRevision() {
  const revisionResult = spawnSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  });

  if (revisionResult.status !== 0) {
    return 'unknown';
  }

  const revision = revisionResult.stdout.trim();
  const statusResult = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
  });

  return statusResult.status === 0 && statusResult.stdout.trim()
    ? `${revision}-dirty`
    : revision;
}

/**
 * Force local-docker host ports from SSOT so local stack never steals host-dev/e2e ports.
 * Secrets and service env still come from .env.production.local.
 */
function applyLocalDockerHostPortIsolation(env, envFileMap) {
  /** @type {Record<string, string>} */
  const fromFile = {};
  const profile = getRuntimeProfile('local-docker');
  for (const key of Object.keys(profile.hostPortEnv ?? {})) {
    if (envFileMap.has(key)) {
      fromFile[key] = envFileMap.get(key) ?? '';
    } else if (env[key]) {
      fromFile[key] = String(env[key]);
    }
  }

  const resolved = resolveLocalDockerHostPorts(fromFile);
  for (const warning of resolved.warnings) {
    console.warn(`[docker:local] ${warning}`);
  }
  for (const error of resolved.errors) {
    console.error(`[docker:local] ${error}`);
  }
  if (!resolved.ok) {
    process.exit(1);
  }

  for (const [key, value] of Object.entries(resolved.forced)) {
    env[key] = value;
  }

  // Keep public PowerSync URL aligned with isolated host port when unset or still pointing at classic ports.
  const powersyncHostPort = resolved.forced.POWERSYNC_HOST_PORT ?? '58081';
  const isolatedPowerSyncUrl = `http://localhost:${powersyncHostPort}`;
  const currentPowerSyncUrl = env.POWERSYNC_URL || envFileMap.get('POWERSYNC_URL') || '';
  if (
    !currentPowerSyncUrl ||
    /localhost:8080\b/u.test(currentPowerSyncUrl) ||
    /localhost:8081\b/u.test(currentPowerSyncUrl)
  ) {
    env.POWERSYNC_URL = isolatedPowerSyncUrl;
    if (currentPowerSyncUrl && currentPowerSyncUrl !== isolatedPowerSyncUrl) {
      console.warn(
        `[docker:local] POWERSYNC_URL=${currentPowerSyncUrl} looks like host-dev; using ${isolatedPowerSyncUrl}`,
      );
    }
  }

  console.log(
    `[docker:local] host ports: API=${env.API_HOST_PORT} WEB=${env.WEB_HOST_PORT} AI=${env.AI_SERVICE_HOST_PORT} PS=${env.POWERSYNC_HOST_PORT} PG=${env.POSTGRES_HOST_PORT} REDIS=${env.REDIS_HOST_PORT}`,
  );
}

function createRuntimeEnv() {
  const env = {
    ...process.env,
    NX_DAEMON: 'false',
    NX_ISOLATE_PLUGINS: 'false',
  };
  env.VCS_REF ||= readGitRevision();
  env.BUILD_DATE ||= new Date().toISOString();

  console.log(`[docker:local] image revision: ${env.VCS_REF}`);
  console.log(`[docker:local] image build date: ${env.BUILD_DATE}`);

  const envFileMap = readEnvFileMap(envFile);
  const envKeys = readEnvFileKeys(envFile);
  const developmentEnv = readEnvFileMap('.env.development');

  if (!env.SERVICE_SECRET && !envKeys.has('SERVICE_SECRET')) {
    env.SERVICE_SECRET = 'local-dev-secret';
    console.log('[docker:local] SERVICE_SECRET is not set in .env.production.local, using a local default for Docker validation.');
  }

  const powerSyncFallbacks = {
    POWERSYNC_URL: 'http://localhost:58081',
    POWERSYNC_KEY_ID: developmentEnv.get('POWERSYNC_KEY_ID') ?? 'powersync-dev-d90f228f',
    POWERSYNC_PRIVATE_KEY: developmentEnv.get('POWERSYNC_PRIVATE_KEY') ?? '',
    POWERSYNC_PUBLIC_KEY_N: developmentEnv.get('POWERSYNC_PUBLIC_KEY_N') ?? '',
    POWERSYNC_PUBLIC_KEY_E: developmentEnv.get('POWERSYNC_PUBLIC_KEY_E') ?? 'AQAB',
  };

  for (const [key, fallback] of Object.entries(powerSyncFallbacks)) {
    if (!env[key] && !envKeys.has(key) && fallback) {
      env[key] = fallback;
      console.log(`[docker:local] ${key} is not set in .env.production.local, using a local default.`);
    }
  }

  applyLocalDockerHostPortIsolation(env, envFileMap);

  return env;
}

function runBuildPrep(env, { skipNxCache = false } = {}) {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const nxCacheArgs = skipNxCache ? ['--skipNxCache'] : [];

  run(pnpm, ['nx', 'build', 'api', ...nxCacheArgs], env);
  run(pnpm, ['nx', 'build', 'web', '--configuration=production', ...nxCacheArgs], env);
}

function runDockerCompose(extraArgs, env) {
  run('docker', [...composeArgs, ...extraArgs], env);
}

const env = createRuntimeEnv();

switch (command) {
  case 'build-prep':
    runBuildPrep(env);
    break;
  case 'build-prep:rebuild':
    runBuildPrep(env, { skipNxCache: true });
    break;
  case 'up':
    runBuildPrep(env);
    runDockerCompose(['up', '--build', '-d'], env);
    break;
  case 'rebuild':
    runBuildPrep(env, { skipNxCache: true });
    runDockerCompose(['build', '--no-cache'], env);
    runDockerCompose(['up', '-d'], env);
    break;
  case 'down':
    runDockerCompose(['down'], env);
    break;
  case 'logs':
    runDockerCompose(['logs', '-f'], env);
    break;
  case 'ps':
    runDockerCompose(['ps'], env);
    break;
  default:
    console.error(`Unsupported command: ${command}`);
    process.exit(1);
}
