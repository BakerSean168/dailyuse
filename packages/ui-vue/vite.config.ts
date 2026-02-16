import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {})
];

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    dts({
      tsconfigPath: path.resolve(__dirname, 'tsconfig.dts.json'),
      entryRoot: path.resolve(__dirname, 'src'),
      include: ['src/index.ts'],
      outDir: path.resolve(__dirname, 'dist')
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        'vue',
        'pinia',
        '@dailyuse/ui-core',        // 内部包
        '@dailyuse/ui-vue-shadcn', // 内部包
        '@dailyuse/contracts',      // 内部包
        'lucide-vue-next',
        'radix-vue'
      ],
      output: {
        exports: 'named'
      }
    }
  }
});
