// Baseline: ../../eslint.config.ts
// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import baseConfig from '../../eslint.config.ts';

export default defineConfig([
  ...baseConfig,
  expoConfig,
  {
    ignores: ['dist/*'],
  },
]);
