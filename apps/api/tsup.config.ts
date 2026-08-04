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

  // Runtime artifact policy: workspace Modules stay behind their package
  // Interface, while third-party packages are derived from package.json/node_modules
  // instead of repeated as a second handwritten dependency manifest here.
  skipNodeModulesBundle: true,
  external: [
    /^@memoflow\//,
    '@prisma/client',
    '@powersync/node',
  ],

  // Build targets must be one-shot and must not inherit watch mode from ambient NODE_ENV.
  watch: false,

  // Success message
  onSuccess: async () => {
    console.log('✅ Build successful');
  },
});
