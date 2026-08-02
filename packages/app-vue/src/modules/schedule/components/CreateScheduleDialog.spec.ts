import { DOMWrapper, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../locales/en-US';
import CreateScheduleDialog from './CreateScheduleDialog.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: { 'en-US': enUS },
});

describe('CreateScheduleDialog submission lifecycle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('blocks duplicate submission and preserves the draft when saving fails', async () => {
    let resolveSubmit!: (value: boolean) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const wrapper = mount(CreateScheduleDialog, {
      props: { modelValue: true, onSubmit },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    const title = new DOMWrapper(
      document.querySelector<HTMLInputElement>('[data-testid="schedule-title-input"]')!,
    );
    const save = new DOMWrapper(
      document.querySelector<HTMLButtonElement>('[data-testid="schedule-save-button"]')!,
    );
    await title.setValue('Release review');
    await save.trigger('click');
    await save.trigger('click');
    await nextTick();

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(save.element.disabled).toBe(true);

    resolveSubmit(false);
    await nextTick();
    await nextTick();

    expect(title.element.value).toBe('Release review');
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('still here');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('closes and clears the draft only after saving succeeds', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const wrapper = mount(CreateScheduleDialog, {
      props: { modelValue: true, onSubmit },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    await new DOMWrapper(
      document.querySelector<HTMLInputElement>('[data-testid="schedule-title-input"]')!,
    ).setValue('Release review');
    await new DOMWrapper(
      document.querySelector<HTMLButtonElement>('[data-testid="schedule-save-button"]')!,
    ).trigger('click');
    await nextTick();
    await nextTick();

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    wrapper.unmount();
  });
});
