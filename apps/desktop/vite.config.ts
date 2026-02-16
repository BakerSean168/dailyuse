/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 原生模块列表
const nativeModules = ['better-sqlite3', 'electron'];

// 主进程外部化：原生模块 + 所有 @dailyuse/* 工作区包
const electronMainExternal = [...nativeModules, /^@dailyuse\//];

// 本地工作区包（避免被 optimizeDeps 处理�?
const workspacePkgs = [
  '@dailyuse/utils',
  '@dailyuse/contracts',
  '@dailyuse/ui-react-shadcn',
];

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@preload': path.resolve(__dirname, './src/preload'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      // 浏览器环�?Node.js polyfills
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'buffer': 'buffer',
    },
  },
  define: {
    // �?crypto-browserify 提供全局 Buffer
    'global': 'globalThis',
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
    react(),
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
              external: electronMainExternal,
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
