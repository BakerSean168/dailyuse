import { defineConfig } from 'tsup';
import path from 'path';
import vuePlugin from 'esbuild-plugin-vue';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  // 🔥 关键修复：esbuild 要求 define 的值必须是字符串化的
  define: {
    '__VUE_OPTIONS_API__': 'true',
    '__VUE_PROD_DEVTOOLS__': 'false',
    '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false'
  },
  external: [
    'vue',
    // ai 添加的
    'radix-vue',
    '@radix-ui/vue-icons',
    'lucide-vue-next',
    'clsx',
    'tailwind-merge'
  ],
  sourcemap: true,
  esbuildPlugins: [
    vuePlugin()
  ],
  
  esbuildOptions(options) {
    options.alias = {
      '@': path.resolve(__dirname, 'src'),
    };
  },
});
