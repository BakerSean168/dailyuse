import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const command = process.argv[2] ?? 'up';
const envFile = '.env.production.local';
const composeArgs = ['compose', '-f', 'docker-compose.prod.yml', '-f', 'docker-compose.local.yml', '--env-file', envFile];

function readEnvFileKeys(path) {
  if (!existsSync(path)) {
    return new Set();
  }

  const keys = new Set();
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

    keys.add(trimmed.slice(0, separatorIndex).trim());
  }

  return keys;
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

  if (!env.SERVICE_SECRET && !envKeys.has('SERVICE_SECRET')) {
    env.SERVICE_SECRET = 'local-dev-secret';
    console.log('[docker:local] SERVICE_SECRET is not set in .env.production.local, using a local default for Docker validation.');
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
