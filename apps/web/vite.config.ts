/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig(({ mode, command }) => {
  // Load env files from workspace root (centralized .env files)
  const workspaceRoot = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, workspaceRoot, '');
  
  // 👉 新增这段打印代码
  console.log('================ 环境变量加载结果 ================');
  console.log(`[Vite Config] 当前 Mode: ${mode}`);
  console.log(`[Vite Config] 寻找 .env 的目录: ${workspaceRoot}`);
  console.log('[Vite Config] 读取到的所有环境变量:');
  // console.log(env); // 直接打印整个对象
  // 如果内容太多，也可以只打印你关心的部分：
  // console.log('[Vite Config] API_URL:', env.API_URL);
  // console.log('[Vite Config] PROXY_TARGET_URL:', env.PROXY_TARGET_URL);
  console.log('[Vite Config] Mock:', env.VITE_ENABLE_MOCK_API);
  console.log('[Vite Config] Test Env:', env.VITE_TEST_ENV);
  console.log('==================================================');

  // 开发模式判断：serve 命令或非 production mode
  const isDev = command === 'serve' || mode !== 'production';

  
  const isCiOrDocker =
    process.env.CI === 'true' ||
    process.env.DOCKER === 'true' ||
    process.env.NO_OPEN === 'true';
  
  // 分离代理目标。如果 env 里没有配置，默认指向本地 3000
  // 注意这里用的是给后端直连的地址，比如 http://localhost:3000
  const proxyTarget = env.PROXY_TARGET_URL || env.API_URL || 'http://localhost:3000';
  const needProxy = mode === 'development';
  
  console.log(`[Vite Config] Command: ${command}, Mode: ${mode}`);
  console.log(`[Vite Config] API Base URL: ${proxyTarget}`);
  console.log(`[Vite Config] Using Proxy: ${needProxy}`);
  console.log(`[Vite Config] Is Dev: ${isDev}`);
  
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
      // 打包分析插件（仅生产模式）
      // 生产分析在本地执行，Docker/CI 环境不启用以避免打开浏览器/PowerShell
      // （如需启用请设置环境变量并在宿主机运行）
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
      proxy: mode === 'development' ? {
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
              console.log('代理错误', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('发送请求到目标:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('接收响应:', proxyRes.statusCode, req.url);
              // SSE 请求特殊处理
              if (req.url?.includes('/sse/')) {
                console.log('SSE 响应头:', proxyRes.headers);
              }
            });
          },
        },
      } : undefined,
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
