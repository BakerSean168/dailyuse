/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import {
  electronExternalWorkspacePackages,
  electronJsExternalPackages,
  electronNativeModules,
} from './runtime-external.config.mjs';
import {
  createAppVueSourceAliasEntries,
  createAssetsAliasEntries,
  createContractsAliasEntries,
  createUiVueSourceAliasEntries,
  createWorkspaceSourceAliasEntries,
} from '../../vite.workspace-aliases';

const desktopRendererDevWorkspaceEntries = [
  ['@dailyuse/ai/client', 'packages/ai/src/client/index.ts'],
  ['@dailyuse/ai/electron', 'packages/ai/src/electron/index.ts'],
  ['@dailyuse/goal/client', 'packages/goal/src/client/index.ts'],
  ['@dailyuse/goal/electron', 'packages/goal/src/electron/index.ts'],
  ['@dailyuse/ipc-client', 'packages/ipc-client/src/index.ts'],
  ['@dailyuse/task/client', 'packages/task/src/client/index.ts'],
  ['@dailyuse/schedule/client', 'packages/schedule/src/client/index.ts'],
  ['@dailyuse/schedule/electron', 'packages/schedule/src/electron/index.ts'],
  ['@dailyuse/reminder/client', 'packages/reminder/src/client/index.ts'],
  ['@dailyuse/reminder/electron', 'packages/reminder/src/electron/index.ts'],
  ['@dailyuse/notification/client', 'packages/notification/src/client/index.ts'],
  ['@dailyuse/notification/electron', 'packages/notification/src/electron/index.ts'],
  ['@dailyuse/editor/client', 'packages/editor/src/client/index.ts'],
  ['@dailyuse/editor/electron', 'packages/editor/src/electron/index.ts'],
] as const;

const nativeModules = electronNativeModules;
const workspaceExternal = electronExternalWorkspacePackages;
const electronMainExternalList = [...nativeModules, ...electronJsExternalPackages];

function isElectronMainExternal(id: string): boolean {
  if (electronMainExternalList.includes(id)) return true;
  for (const pkg of workspaceExternal) {
    if (id === pkg) return true;
    if (id.startsWith(pkg + '/')) return true;
  }
  return false;
}

// Workspace packages to exclude from optimizeDeps
const workspacePkgs = [
  '@dailyuse/utils',
  '@dailyuse/contracts',
  '@dailyuse/app-vue',
  '@dailyuse/dashboard',
  '@dailyuse/ui-vue-shadcn',
  '@dailyuse/ipc-client',
  '@dailyuse/assets',
];

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode !== 'production';
  const workspaceRoot = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, workspaceRoot, '');
  Object.assign(process.env, env);
  const devWorkspaceAliases = isDev
    ? [
        ...createAppVueSourceAliasEntries(workspaceRoot),
        ...createAssetsAliasEntries(workspaceRoot),
        ...createUiVueSourceAliasEntries(workspaceRoot),
        ...createContractsAliasEntries(workspaceRoot),
        ...createWorkspaceSourceAliasEntries(workspaceRoot, desktopRendererDevWorkspaceEntries),
      ]
    : createAssetsAliasEntries(workspaceRoot);

  const rendererAliases = [
    ...devWorkspaceAliases,
    ...createWorkspaceSourceAliasEntries(workspaceRoot, [
    ]),
    {
      find: '@main',
      replacement: path.resolve(__dirname, './src/main'),
    },
    {
      find: '@preload',
      replacement: path.resolve(__dirname, './src/preload'),
    },
    {
      find: '@renderer',
      replacement: path.resolve(__dirname, './src/renderer'),
    },
    {
      find: '@',
      replacement: path.resolve(__dirname, './src'),
    },
    {
      find: 'crypto',
      replacement: 'crypto-browserify',
    },
    {
      find: 'stream',
      replacement: 'stream-browserify',
    },
    {
      find: 'buffer',
      replacement: 'buffer',
    },
  ];

  return {
    assetsInclude: ['**/*.icns'],
    resolve: {
      conditions: ['import', 'module', 'default'],
      alias: rendererAliases,
    },
    define: {
      global: 'globalThis',
    },
    worker: {
      format: 'es',
    },
    base: './',
    build: {
      outDir: 'dist-renderer',
      rolldownOptions: {
        input: path.resolve(__dirname, 'index.html'),
        external: nativeModules,
      },
    },
    optimizeDeps: {
      exclude: [...nativeModules, ...workspacePkgs],
    },
    server: {
      port: Number(env.VITE_DEV_PORT) || 5173,
      open: false,
      fs: {
        allow: [workspaceRoot],
      },
    },
    test: {
      globals: true,
      include: ['src/**/*.test.ts'],
      environment: 'jsdom',
    },
    plugins: [
      vue(),
      tailwindcss(),
      electron({
        main: {
          entry: path.resolve(__dirname, 'src/main/main.ts'),
          vite: {
            resolve: {
              alias: [
                {
                  find: '@main',
                  replacement: path.resolve(__dirname, './src/main'),
                },
                {
                  find: '@preload',
                  replacement: path.resolve(__dirname, './src/preload'),
                },
                {
                  find: '@renderer',
                  replacement: path.resolve(__dirname, './src/renderer'),
                },
              ],
            },
            build: {
              outDir: 'dist-electron',
              rolldownOptions: {
                external: isElectronMainExternal,
                output: {
                  format: 'cjs',
                  entryFileNames: '[name].cjs',
                  chunkFileNames: '[name].cjs',
                  assetFileNames: '[name].[ext]',
                },
              },
            },
            optimizeDeps: {
              exclude: [...nativeModules, ...workspacePkgs],
            },
          },
        },
        preload: {
          input: {
            preload: path.resolve(__dirname, 'src/preload/preload.ts'),
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rolldownOptions: {
                external: nativeModules,
                output: {
                  format: 'cjs',
                  inlineDynamicImports: false,
                  entryFileNames: '[name].cjs',
                },
              },
            },
            optimizeDeps: {
              exclude: [...nativeModules, ...workspacePkgs],
            },
          },
        },
        renderer: process.env.NODE_ENV === 'test' ? undefined : {},
      }),
    ],
  };
});
