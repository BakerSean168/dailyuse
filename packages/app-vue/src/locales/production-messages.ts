/**
 * Shared production locale messages for unit tests.
 *
 * Specs that mount vue-i18n must import from here (or from `./zh-CN` /
 * `./en-US` directly) instead of hand-built stubs that hide missing keys.
 */
import zhCN from './zh-CN';
import enUS from './en-US';

export const productionLocaleMessages = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const;

export { zhCN, enUS };
