/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig(({ mode, command }) => {
  // Load env files from workspace root (centralized .env files)
  const workspaceRoot = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, workspaceRoot, '');

  // Dev mode: serve command or non-production mode
  const isDev = command === 'serve' || mode !== 'production';

  // Proxy target for API requests (local dev only)
  const proxyTarget = env.PROXY_TARGET_URL || env.API_URL || 'http://localhost:3000';

  return {
    // Keep app root, but read env files from workspace root
    root: __dirname,
    envDir: workspaceRoot,
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        // 仅项目内部别名
        '@': path.resolve(__dirname, './src'),
        '@dailyuse/app-vue': path.resolve(__dirname, '../../packages/app-vue/src/index.ts'),
        '@dailyuse/authentication/application-client': path.resolve(
          __dirname,
          '../../packages/authentication/src/application-client/index.ts',
        ),
        '@dailyuse/authentication/infrastructure-client': path.resolve(
          __dirname,
          '../../packages/authentication/src/infrastructure-client/index.ts',
        ),
        // 注意：所有 @dailyuse/* 包通过 node_modules 解析到各包的 dist 目录
        // 不再使用指向源码的别名，这样可以：
        // 1. 保持包边界清晰
        // 2. 让 TypeScript 和 Vite 使用相同的解析策略
        // 3. 确保类型声明正确生成
      },
    },
    plugins: [
      vue({
        template: {
          transformAssetUrls: {
            base: null,
            includeAbsolute: false,
          },
        },
      }),
      tailwindcss(),
    ].filter(Boolean),
    server: {
      port: 5173,
      open: false,
      middlewareMode: false,
      // 完全禁用 Vite 的压缩中间件，避免破坏 SSE 流
      compress: false,
      fs: {
        allow: ['..', '../../'],
      },
      // 添加代理配置,解决 EventSource 跨域问题
      // 仅在使用本地开发环境时启用代理
      proxy:
        mode === 'development'
          ? {
              '/api/v1': {
                target: proxyTarget,
                changeOrigin: true,
                secure: false,
                ws: true, // 支持 WebSocket
                // 禁用压缩，否则会破坏 SSE 流
                compress: false,
                // SSE 特定配置
                onProxyRes: (proxyRes: any, req: any, res: any) => {
                  // 确保 SSE 流不被缓冲和压缩
                  if (req.url?.includes('/sse/')) {
                    // 删除可能存在的压缩相关头
                    delete proxyRes.headers['content-encoding'];
                    // 防止下游再次压缩
                    proxyRes.headers['x-no-compression'] = 'true';
                  }
                },
                configure: (proxy, _options) => {
                  proxy.on('error', (err, _req, _res) => {
                    console.error('[proxy]', err);
                  });
                },
              },
            }
          : undefined,
    },
    preview: {
      port: 5173,
      open: false,
    },
    build: {
      sourcemap: isDev,
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.spec.ts'],
      exclude: ['node_modules', 'dist', '.git', '.cache'],
      passWithNoTests: true,
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
      // Mock CSS and asset imports
      server: {
        deps: {
          inline: [],
        },
      },
    },
  };
});
