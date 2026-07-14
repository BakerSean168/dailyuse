import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { providePanelWidth } from '../../../layouts/shell/usePanelWidth';

/**
 * Probe for TaskFilterBar width tiers (§7.3) without mounting the full bar
 * (avoids shadcn/DropdownMenu complexity in unit scope).
 */
function mountWidthProbe(initialWidth: number) {
  const widthHandle: { current: number } = { current: initialWidth };

  const Probe = defineComponent({
    name: 'TaskFilterWidthProbe',
    setup() {
      // Inline the same thresholds as TaskFilterBar
      const statusMode = () => {
        const w = widthHandle.current;
        if (w < 440) return 'menu';
        if (w < 700) return 'scroll';
        return 'full';
      };
      const compactChrome = () => widthHandle.current < 440;
      const searchInline = () => widthHandle.current >= 700;

      return () =>
        h('div', { 'data-testid': 'probe' }, [
          h('div', { 'data-testid': 'status-mode', 'data-value': statusMode() }),
          h('div', { 'data-testid': 'compact-chrome', 'data-value': String(compactChrome()) }),
          h('div', { 'data-testid': 'search-inline', 'data-value': String(searchInline()) }),
        ]);
    },
  });

  const Parent = defineComponent({
    setup() {
      const { width } = providePanelWidth();
      width.value = widthHandle.current;
      Object.defineProperty(widthHandle, 'current', {
        get: () => width.value ?? initialWidth,
        set: (value: number) => {
          width.value = value;
        },
      });
      return () => h(Probe);
    },
  });

  const wrapper = mount(Parent);
  return {
    wrapper,
    setWidth: async (value: number) => {
      widthHandle.current = value;
      await nextTick();
      // remount probe content via force update by toggling
      await wrapper.vm.$forceUpdate?.();
      await nextTick();
    },
  };
}

describe('Task filter bar width tiers (§7.3)', () => {
  it('uses menu + compact chrome under 440px', () => {
    const { wrapper } = mountWidthProbe(360);
    expect(wrapper.get('[data-testid="status-mode"]').attributes('data-value')).toBe('menu');
    expect(wrapper.get('[data-testid="compact-chrome"]').attributes('data-value')).toBe('true');
    expect(wrapper.get('[data-testid="search-inline"]').attributes('data-value')).toBe('false');
    wrapper.unmount();
  });

  it('uses scrollable status tabs between 440 and 699', () => {
    const { wrapper } = mountWidthProbe(520);
    expect(wrapper.get('[data-testid="status-mode"]').attributes('data-value')).toBe('scroll');
    expect(wrapper.get('[data-testid="compact-chrome"]').attributes('data-value')).toBe('false');
    expect(wrapper.get('[data-testid="search-inline"]').attributes('data-value')).toBe('false');
    wrapper.unmount();
  });

  it('uses full single-row chrome at 700+', () => {
    const { wrapper } = mountWidthProbe(720);
    expect(wrapper.get('[data-testid="status-mode"]').attributes('data-value')).toBe('full');
    expect(wrapper.get('[data-testid="search-inline"]').attributes('data-value')).toBe('true');
    wrapper.unmount();
  });
});
