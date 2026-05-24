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
import { usePresentationPreferenceStore } from '../stores/presentation-preference-store';
import { setMenuLocale } from '../../../components/shared/menu-labels';
import type { SupportedLocale } from '../../../components/shared/menu-labels';
import { setI18nLocale } from '../../../plugins/i18n';

const SUPPORTED: SupportedLocale[] = ['zh-CN', 'en-US'];

function isSupportedLocale(v: unknown): v is SupportedLocale {
  return typeof v === 'string' && SUPPORTED.includes(v as SupportedLocale);
}

export function useLocaleSync() {
  const { locale } = useI18n({ useScope: 'global' });
  const store = usePresentationPreferenceStore();

  // Immediate sync + reactive watch
  const syncLocale = async () => {
    const lang = store.locale;
    if (isSupportedLocale(lang)) {
      if (lang !== locale.value) {
        await setI18nLocale(lang);
      }

      setMenuLocale(lang);
      document.documentElement.lang = lang;
    }
  };

  const runSyncLocale = () => {
    void syncLocale().catch((error) => {
      console.error('[i18n] Failed to sync locale', error);
    });
  };

  // Run once on mount
  runSyncLocale();

  // Watch for subsequent store changes
  watch(() => store.locale, runSyncLocale);

  return { locale };
}
