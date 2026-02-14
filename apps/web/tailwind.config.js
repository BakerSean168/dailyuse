import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const preset = require("@dailyuse/ui-core/tailwind.preset");

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    '../../packages/ui-vue/src/**/*.{vue,js,ts}',
    '../../packages/ui-vue-shadcn/src/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {},
  },
}
