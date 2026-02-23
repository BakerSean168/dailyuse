
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
  resolve: {
    alias: [
      { find: /^@dailyuse\/contracts\/task$/, replacement: path.resolve(__dirname, '../../contracts/src/modules/task/index.ts') },
      { find: /^@dailyuse\/contracts\/shared$/, replacement: path.resolve(__dirname, '../../contracts/src/shared/index.ts') },
      { find: /^@dailyuse\/contracts\/primitives$/, replacement: path.resolve(__dirname, '../../contracts/src/primitives/index.ts') },
      { find: /^@dailyuse\/contracts$/, replacement: path.resolve(__dirname, '../../contracts/src/index.ts') },
      { find: /^@dailyuse\/domain-shared$/, replacement: path.resolve(__dirname, '../../domain-shared/src/index.ts') },
      { find: /^@dailyuse\/utils$/, replacement: path.resolve(__dirname, '../../utils/src/index.ts') },
    ]
  }
});
