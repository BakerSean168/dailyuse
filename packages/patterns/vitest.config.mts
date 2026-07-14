import { defineConfig } from 'vitest/config';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/patterns',
  plugins: [nxCopyAssetsPlugin(['*.md'])],
  resolve: { tsconfigPaths: true },
  test: {
    name: 'patterns',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/patterns',
      provider: 'v8' as const,
    }
  },
}));
