import { createI18n } from 'vue-i18n';

import { enUSAuthMessages, zhCNAuthMessages } from './messages';
import type { AuthLocale } from './presentation';

export function createAuthI18n(locale: AuthLocale) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-CN',
    messages: {
      'zh-CN': zhCNAuthMessages,
      'en-US': enUSAuthMessages,
    },
    missingWarn: false,
    fallbackWarn: false,
  });
}
