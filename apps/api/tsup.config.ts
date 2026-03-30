import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry point
  entry: ['src/main.ts'],

  // Output format: ESM only (matches package.json "type": "module")
  format: ['esm'],

  // Target Node.js version
  target: 'node20',

  // Output directory
  outDir: 'dist',

  // Generate source maps for debugging
  sourcemap: true,

  // Clean output directory before build
  clean: true,

  // Disable code splitting (keep single output file for simplicity)
  splitting: false,

  // Enable tree shaking
  treeshake: true,

  // Generate TypeScript declaration files
  // TEMPORARY: Disabled due to tsconfig composite project issues
  // dts: true,
  dts: false,

  // esbuild options for module resolution
  esbuildOptions(options) {
    // Allow importing .ts files without extension
    options.resolveExtensions = ['.ts', '.js', '.mjs', '.json'];
  },

  // External dependencies (don't bundle these)
  external: [
    // ✅ 所有 @dailyuse/* workspace 包（运行时从 node_modules 加载）
    /^@dailyuse\//,

    // ✅ Prisma Client（必须外部化，包含二进制引擎）
    '@prisma/client',

    // All @nestjs packages
    /^@nestjs\//,

    // Node.js built-in modules
    /^node:/,

    // All other dependencies from package.json
    'express',
    'cors',
    'helmet',
    'compression',
    'cookie-parser',
    'bcryptjs',
    'jsonwebtoken',
    'swagger-jsdoc',
    'swagger-ui-express',
    '@asteasolutions/zod-to-openapi',
    'node-cron',
    'zod',
    'ioredis',
    'dotenv',
    'reflect-metadata',
    'rxjs',
    'diff-match-patch',
    'bree',
  ],

  // Watch mode in development
  watch: process.env.NODE_ENV === 'development',

  // Success message
  onSuccess: async () => {
    console.log('✅ Build successful');
  },
});
