import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const preset = require("@dailyuse/ui-core/tailwind.preset");

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './pages/**/*.{ts,tsx,vue}',
    './components/**/*.{ts,tsx,vue}',
    './app/**/*.{ts,tsx,vue}',
    './src/**/*.{ts,tsx,vue}',
  ],
  theme: {
    extend: {},
  },
}
