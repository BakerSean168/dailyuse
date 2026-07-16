import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave locale behavior', () => {
  it('retranslates the current conflict when the locale changes', async () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en-US',
      messages: {
        'en-US': {
          editor: { autoSave: { conflictDetected: 'A newer version exists.' } },
        },
        'zh-CN': {
          editor: { autoSave: { conflictDetected: '存在更新版本。' } },
        },
      },
    });
    let autoSave!: ReturnType<typeof useAutoSave>;

    mount(
      defineComponent({
        setup() {
          autoSave = useAutoSave({
            content: () => 'draft',
            hasChanges: () => true,
            saveFn: async () => ({ success: false, conflict: true }),
          });
          return () => h('div');
        },
      }),
      { global: { plugins: [i18n] } },
    );

    await autoSave.save();
    expect(autoSave.saveError.value).toBe('A newer version exists.');

    i18n.global.locale.value = 'zh-CN';
    await nextTick();

    expect(autoSave.saveError.value).toBe('存在更新版本。');
  });
});
