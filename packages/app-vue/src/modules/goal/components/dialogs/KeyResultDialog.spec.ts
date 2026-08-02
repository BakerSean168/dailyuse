import { DOMWrapper, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../../locales/en-US';
import KeyResultDialog from './KeyResultDialog.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: { 'en-US': enUS },
});

describe('KeyResultDialog submission lifecycle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('awaits submission and preserves the draft when submission fails', async () => {
    let resolveSubmit!: (value: boolean) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const wrapper = mount(KeyResultDialog, {
      props: { onSubmit },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    wrapper.vm.openForCreateKeyResult('goal-1');
    await nextTick();

    await new DOMWrapper(
      document.querySelector<HTMLInputElement>('[data-testid="key-result-title-input"]')!,
    ).setValue('Reliable delivery');
    await new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="save-key-result-button"]')!,
    ).trigger('click');
    await nextTick();

    expect(
      document.querySelector<HTMLButtonElement>('[data-testid="save-key-result-button"]')?.disabled,
    ).toBe(true);
    expect(document.querySelector('[data-testid="key-result-dialog"]')).not.toBeNull();

    resolveSubmit(false);
    await nextTick();
    await nextTick();

    expect(
      document.querySelector<HTMLInputElement>('[data-testid="key-result-title-input"]')?.value,
    ).toBe('Reliable delivery');
    expect(document.querySelector('[role="alert"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('closes after the awaited submission succeeds', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const wrapper = mount(KeyResultDialog, {
      props: { onSubmit },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    wrapper.vm.openForCreateKeyResult('goal-1');
    await nextTick();

    await new DOMWrapper(
      document.querySelector<HTMLInputElement>('[data-testid="key-result-title-input"]')!,
    ).setValue('Reliable delivery');
    await new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="save-key-result-button"]')!,
    ).trigger('click');
    await nextTick();
    await nextTick();

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(document.querySelector('[data-testid="key-result-dialog"]')).toBeNull();
    wrapper.unmount();
  });
});
