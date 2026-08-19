/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { Target } from '@lucide/vue';
import { h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModuleCapsule from './ModuleCapsule.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      shell: { previewModule: 'Preview {name}' },
    },
  },
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ModuleCapsule', () => {
  it('separates direct navigation from hover and pinned preview interactions', async () => {
    vi.useFakeTimers();
    const wrapper = mount(ModuleCapsule, {
      props: { id: 'goal', label: 'Goals', route: '/goals', icon: Target },
      slots: { default: '<div data-testid="preview-content">Goals preview</div>' },
      global: { plugins: [i18n] },
    });

    const navigation = wrapper.get('[data-testid="capsule-nav-goal"]');
    const preview = wrapper.get('[data-testid="capsule-preview-goal"]');

    await navigation.trigger('click');
    expect(wrapper.emitted('open')).toEqual([[{ id: 'goal', route: '/goals' }]]);

    // Quick pointer passes must not flash the preview open.
    await preview.trigger('mouseenter');
    expect(preview.attributes('aria-expanded')).toBe('false');
    vi.advanceTimersByTime(200);
    await preview.trigger('mouseleave');
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(preview.attributes('aria-expanded')).toBe('false');

    // A deliberate hover dwell opens, then the existing close grace period applies.
    await preview.trigger('mouseenter');
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(preview.attributes('aria-expanded')).toBe('true');
    await preview.trigger('mouseleave');
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(preview.attributes('aria-expanded')).toBe('false');

    // Keyboard focus stays immediate for accessibility.
    await preview.trigger('focus');
    expect(preview.attributes('aria-expanded')).toBe('true');
    await preview.trigger('blur');
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(preview.attributes('aria-expanded')).toBe('false');

    await preview.trigger('click');
    expect(wrapper.get('[data-testid="capsule-preview-goal"]').attributes('aria-expanded')).toBe(
      'true',
    );
    await preview.trigger('mouseleave');
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(wrapper.get('[data-testid="capsule-preview-goal"]').attributes('aria-expanded')).toBe(
      'true',
    );

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await nextTick();
    expect(wrapper.get('[data-testid="capsule-preview-goal"]').attributes('aria-expanded')).toBe(
      'false',
    );

    wrapper.unmount();
  });

  it('exposes a close callback to interactive preview content', async () => {
    const wrapper = mount(ModuleCapsule, {
      attachTo: document.body,
      props: { id: 'goal', label: 'Goals', route: '/goals', icon: Target },
      slots: {
        default: ({ closePreview }) =>
          h('button', { 'data-testid': 'preview-close', onClick: closePreview }, 'Open all'),
      },
      global: { plugins: [i18n] },
    });

    const preview = wrapper.get('[data-testid="capsule-preview-goal"]');
    await preview.trigger('click');
    await nextTick();

    const closeButton = document.querySelector<HTMLButtonElement>('[data-testid="preview-close"]');
    expect(closeButton).not.toBeNull();
    closeButton?.click();
    await nextTick();
    expect(preview.attributes('aria-expanded')).toBe('false');

    wrapper.unmount();
  });
});
