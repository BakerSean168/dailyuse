const defaultApiOrigin = process.env.E2E_API_BASE_URL ?? 'http://localhost:3000';

process.env.E2E_API_BASE_URL ??= defaultApiOrigin;
process.env.E2E_API_FULL_URL ??= `${defaultApiOrigin.replace(/\/+$/, '')}/api/v1`;

const sharedServerOptions = {
  reuseExistingServer: !process.env.CI,
  timeout: 300 * 1000,
} as const;

export function createApiServer() {
  return {
    // API 运行时通过 workspace 包导出消费 server-side 模块；
    // 先 build 可以避免 stale dist 让 E2E 读到过期产物。
    command: 'pnpm nx build api && node dist/apps/api/main.js',
    cwd: '.',
    url: `${defaultApiOrigin}/healthz`,
    ...sharedServerOptions,
  };
}

export function createWebServer(url = 'http://127.0.0.1:5173/auth') {
  return {
    command: 'pnpm exec vite --config vite.config.ts --host 127.0.0.1 --port 5173',
    cwd: 'apps/web',
    url,
    env: {
      ...process.env,
      PROXY_TARGET_URL: defaultApiOrigin,
    },
    ...sharedServerOptions,
  };
}

export { defaultApiOrigin };
