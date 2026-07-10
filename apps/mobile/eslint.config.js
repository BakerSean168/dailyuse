// https://docs.expo.dev/guides/using-eslint/
// 本地配置以根 eslint.config.ts 为基线（见 docs/governance/configuration-governance.md），
// 再叠加 Expo / React Native 生态需要的规则；不复制根规则，只保留最小例外。
const { createJiti } = require('jiti');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const jiti = createJiti(__filename);
const rootConfig = jiti('../../eslint.config.ts').default;

module.exports = defineConfig([
  ...rootConfig,
  expoConfig,
  {
    ignores: ['dist/*'],
  },
]);
