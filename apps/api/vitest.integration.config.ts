/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@memoflow/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
      '@memoflow/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // 集成测试不使用 setup 文件，避免 Mock
    // setupFiles: [],
    include: ['src/**/*.integration.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    exclude: ['node_modules', 'dist', '.git', '.cache', 'prisma/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', 'prisma/', '**/*.d.ts', '**/*.config.*', 'dist/'],
    },
    // 集成测试超时设置（数据库操作需要更长时间）
    testTimeout: 60000,
    // 序列化测试，避免数据库冲突
    pool: 'forks',
    maxWorkers: 1,
    isolate: false,
  },
});
