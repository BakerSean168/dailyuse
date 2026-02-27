/**
 * useLocaleSync — Bridges the user setting store to vue-i18n.
 *
 * Call this once from App.vue (or any root-level component).
 * It watches `userSettingStore.getValue('locale.language')` and
 * syncs the value to:
 *   1. vue-i18n's `locale` ref
 *   2. `setMenuLocale()` (backward compat for ActionableWrapper)
 *   3. `document.documentElement.lang` attribute
 */

import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserSettingStore } from '../stores/userSettingStore';
import { setMenuLocale } from '../../../components/shared/menu-labels';
import type { SupportedLocale } from '../../../components/shared/menu-labels';

const SUPPORTED: SupportedLocale[] = ['zh-CN', 'en-US'];

function isSupportedLocale(v: unknown): v is SupportedLocale {
  return typeof v === 'string' && SUPPORTED.includes(v as SupportedLocale);
}

export function useLocaleSync() {
  const { locale } = useI18n({ useScope: 'global' });
  const store = useUserSettingStore();

  // Immediate sync + reactive watch
  const syncLocale = () => {
    const lang = store.getValue('locale.language');
    if (isSupportedLocale(lang) && lang !== locale.value) {
      locale.value = lang;
      setMenuLocale(lang);
      document.documentElement.lang = lang;
    }
  };

  // Run once on mount
  syncLocale();

  // Watch for subsequent store changes
  watch(() => store.getValue('locale.language'), syncLocale);

  return { locale };
}
