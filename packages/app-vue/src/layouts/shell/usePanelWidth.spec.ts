import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { PANEL_WIDE_THRESHOLD, providePanelWidth, usePanelWidth } from './usePanelWidth';

function mountWithPanelWidth(initialWidth: number | null) {
  const Child = defineComponent({
    name: 'PanelWidthProbe',
    setup() {
      const { width, tier, isNarrow, isWide } = usePanelWidth();
      return () =>
        h('div', {
          'data-testid': 'probe',
          'data-width': width.value == null ? 'null' : String(width.value),
          'data-tier': tier.value,
          'data-narrow': String(isNarrow.value),
          'data-wide': String(isWide.value),
        });
    },
  });

  const Parent = defineComponent({
    name: 'PanelWidthProviderHost',
    setup() {
      const { width } = providePanelWidth();
      width.value = initialWidth;
      return () => h(Child);
    },
  });

  return mount(Parent);
}

describe('usePanelWidth (V2 §7 two-tier)', () => {
  it('defaults to wide outside a panel provider (standalone / unit renders)', () => {
    const Probe = defineComponent({
      setup() {
        const { tier, isNarrow, isWide } = usePanelWidth();
        return () =>
          h('div', {
            'data-testid': 'probe',
            'data-tier': tier.value,
            'data-narrow': String(isNarrow.value),
            'data-wide': String(isWide.value),
          });
      },
    });

    const wrapper = mount(Probe);
    const el = wrapper.get('[data-testid="probe"]');
    expect(el.attributes('data-tier')).toBe('wide');
    expect(el.attributes('data-narrow')).toBe('false');
    expect(el.attributes('data-wide')).toBe('true');
    wrapper.unmount();
  });

  it('classifies widths below the threshold as narrow (split) and above as wide (focus)', async () => {
    const narrow = mountWithPanelWidth(PANEL_WIDE_THRESHOLD - 1);
    let el = narrow.get('[data-testid="probe"]');
    expect(el.attributes('data-tier')).toBe('narrow');
    expect(el.attributes('data-narrow')).toBe('true');
    expect(el.attributes('data-wide')).toBe('false');
    narrow.unmount();

    const wide = mountWithPanelWidth(PANEL_WIDE_THRESHOLD);
    el = wide.get('[data-testid="probe"]');
    expect(el.attributes('data-tier')).toBe('wide');
    expect(el.attributes('data-narrow')).toBe('false');
    expect(el.attributes('data-wide')).toBe('true');
    wide.unmount();
  });

  it('updates tier when the panel width crosses the threshold', async () => {
    const widthHandle: { current: number | null } = { current: 450 };

    const Child = defineComponent({
      setup() {
        const { tier, isNarrow } = usePanelWidth();
        return () =>
          h('div', {
            'data-testid': 'probe',
            'data-tier': tier.value,
            'data-narrow': String(isNarrow.value),
          });
      },
    });

    const Parent = defineComponent({
      setup() {
        const { width } = providePanelWidth();
        width.value = widthHandle.current;
        // Keep the provided ref in sync with the handle so the test can drive tier changes.
        Object.defineProperty(widthHandle, 'current', {
          get: () => width.value,
          set: (value: number | null) => {
            width.value = value;
          },
        });
        return () => h(Child);
      },
    });

    const wrapper = mount(Parent);
    expect(wrapper.get('[data-testid="probe"]').attributes('data-tier')).toBe('narrow');

    widthHandle.current = 1200;
    await nextTick();
    expect(wrapper.get('[data-testid="probe"]').attributes('data-tier')).toBe('wide');
    expect(wrapper.get('[data-testid="probe"]').attributes('data-narrow')).toBe('false');

    widthHandle.current = 320;
    await nextTick();
    expect(wrapper.get('[data-testid="probe"]').attributes('data-tier')).toBe('narrow');
    wrapper.unmount();
  });
});
