// Baseline monorepo ESLint 10 config.
// eslint-config-expo currently pulls eslint-plugin-react@7 which does not support ESLint 10
// (react/display-name crashes on context.getFilename).
import { defineConfig } from 'eslint/config';
import baseConfig from '../../eslint.config.ts';

export default defineConfig([
  ...baseConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
]);
