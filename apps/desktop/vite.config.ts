/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// Native modules — must be externalized (cannot be bundled by Vite)
const nativeModules = ['better-sqlite3', 'electron', 'argon2'];

// Third-party packages that leak into the main process via workspace package
// dist files (e.g. @dailyuse/task uses date-fns, @dailyuse/repository uses
// gray-matter). They are pure-JS so they can be resolved at runtime from
// node_modules; externalizing them avoids Rollup resolution errors.
const thirdPartyLeaks = ['date-fns', 'gray-matter'];

// Workspace packages that must stay external in the main process bundle.
// @dailyuse/database: The main process only uses @dailyuse/database/powersync
// (a standalone PowerSync schema), but barrel re-exports in repository/editor
// transitively pull in the CJS Prisma generated client which Rollup cannot
// resolve. Externalizing the whole package avoids this.
const workspaceExternal = ['@dailyuse/database'];

// Main process external: native modules + leaked third-party packages
// All @dailyuse/* workspace packages are now bundled into main.js
// so electron-builder doesn't need to search the pnpm monorepo
const electronMainExternalList = [...nativeModules, ...thirdPartyLeaks];

// Rollup external function: matches exact strings from the list above,
// plus @dailyuse/database and all its subpaths (e.g. @dailyuse/database/powersync).
function isElectronMainExternal(id: string): boolean {
  if (electronMainExternalList.includes(id)) return true;
  // Match @dailyuse/database exactly or any subpath like @dailyuse/database/powersync
  for (const pkg of workspaceExternal) {
    if (id === pkg || id.startsWith(pkg + '/')) return true;
  }
  return false;
}

// Workspace packages to exclude from optimizeDeps
const workspacePkgs = [
  '@dailyuse/utils',
  '@dailyuse/contracts',
  '@dailyuse/app-vue',
  '@dailyuse/ui-vue-shadcn',
  '@dailyuse/ipc-client',
];

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@preload': path.resolve(__dirname, './src/preload'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      // Browser-env Node.js polyfills
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
  },
  worker: {
    format: 'es',
  },
  base: './',
  build: {
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
            alias: {
              '@main': path.resolve(__dirname, './src/main'),
              '@preload': path.resolve(__dirname, './src/preload'),
              '@renderer': path.resolve(__dirname, './src/renderer'),
            },
          },
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: isElectronMainExternal,
              output: {
                format: 'es',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
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
});
