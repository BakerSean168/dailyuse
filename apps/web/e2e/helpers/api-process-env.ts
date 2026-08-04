export type ApiRuntimeLane = 'e2e' | 'host-dev';

export function createApiProcessEnv(
  baseEnv: NodeJS.ProcessEnv,
  runtimeLane: ApiRuntimeLane,
  logDir: string,
): NodeJS.ProcessEnv {
  return {
    ...baseEnv,
    RUNTIME_LANE: runtimeLane,
    NODE_ENV: baseEnv.NODE_ENV ?? 'test',
    LOCAL_VALIDATION: runtimeLane === 'e2e' ? '1' : '0',
    LOG_DIR: baseEnv.LOG_DIR || logDir,
  };
}
