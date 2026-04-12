import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

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
  const result = spawnSync(bin, args, {
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

function createRuntimeEnv() {
  const env = {
    ...process.env,
    NX_DAEMON: 'false',
    NX_ISOLATE_PLUGINS: 'false',
  };
  const envKeys = readEnvFileKeys(envFile);
  const developmentEnv = readEnvFileMap('.env.development');

  if (!env.SERVICE_SECRET && !envKeys.has('SERVICE_SECRET')) {
    env.SERVICE_SECRET = 'local-dev-secret';
    console.log('[docker:local] SERVICE_SECRET is not set in .env.production.local, using a local default for Docker validation.');
  }

  const powerSyncFallbacks = {
    POWERSYNC_URL: 'http://localhost:8081',
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
