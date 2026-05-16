/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
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
  createAssetsAliasEntries,
  createContractsAliasEntries,
  createUiVueSourceAliasEntries,
  createWorkspaceSourceAliasEntries,
} from '../../vite.workspace-aliases';

const desktopRendererDevWorkspaceEntries = [
  ['@dailyuse/app-vue/web-overlays', 'packages/app-vue/src/web-overlays.ts'],
  ['@dailyuse/app-vue', 'packages/app-vue/src/index.ts'],
  ['@dailyuse/ai/application-client', 'packages/ai/src/application-client/index.ts'],
  ['@dailyuse/ai/infrastructure-client', 'packages/ai/src/infrastructure-client/index.ts'],
  ['@dailyuse/ipc-client', 'packages/ipc-client/src/index.ts'],
  ['@dailyuse/reminder/application-client', 'packages/reminder/src/application-client/index.ts'],
  [
    '@dailyuse/reminder/infrastructure-client',
    'packages/reminder/src/infrastructure-client/index.ts',
  ],
  ['@dailyuse/editor/application-client', 'packages/editor/src/application-client/index.ts'],
  ['@dailyuse/editor/infrastructure-client', 'packages/editor/src/infrastructure-client/index.ts'],
  ['@dailyuse/editor/electron-entry', 'packages/editor/src/electron-entry/index.ts'],
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
  const devWorkspaceAliases = isDev
    ? [
        ...createAssetsAliasEntries(workspaceRoot),
        ...createUiVueSourceAliasEntries(workspaceRoot),
        ...createContractsAliasEntries(workspaceRoot),
        ...createWorkspaceSourceAliasEntries(workspaceRoot, desktopRendererDevWorkspaceEntries),
      ]
    : createAssetsAliasEntries(workspaceRoot);

  const rendererAliases = [
    ...devWorkspaceAliases,
    ...createWorkspaceSourceAliasEntries(workspaceRoot, [
      ['@dailyuse/notification-runtime', 'packages/notification-runtime/src/index.ts'],
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
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        external: nativeModules,
      },
    },
    optimizeDeps: {
      exclude: [...nativeModules, ...workspacePkgs],
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
              rollupOptions: {
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
              rollupOptions: {
                external: nativeModules,
                output: {
                  format: 'cjs',
                  inlineDynamicImports: false,
                  manualChunks: undefined,
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
