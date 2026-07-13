import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { providePanelWidth, usePanelWidth } from '../../../layouts/shell/usePanelWidth';

/**
 * Lightweight probe for S2-Task panel adaptation (V2 §6.2 / §7):
 * - narrow (split): drag disabled + hint visible + graph blocked
 * - wide (focus): drag enabled + graph available
 *
 * Mirrors the decision surface of TaskManagementView without mounting the full
 * 573-line view (which depends on stores/router/dialogs).
 */
function mountTaskPanelAdaptationProbe(initialWidth: number) {
  const widthHandle: { current: number } = { current: initialWidth };

  const Probe = defineComponent({
    name: 'TaskPanelAdaptationProbe',
    setup() {
      const { isNarrow } = usePanelWidth();
      const viewMode = ref<'card' | 'graph'>('card');
      const enableDrag = computed(() => !isNarrow.value);
      const showDragHint = computed(() => isNarrow.value && viewMode.value === 'card');
      const showGraph = computed(() => viewMode.value === 'graph' && !isNarrow.value);
      const showGraphHint = computed(() => viewMode.value === 'graph' && isNarrow.value);

      return () =>
        h('div', { 'data-testid': 'task-adaptation-probe' }, [
          h('div', {
            'data-testid': 'enable-drag',
            'data-value': String(enableDrag.value),
          }),
          showDragHint.value
            ? h('div', { 'data-testid': 'task-drag-narrow-hint' }, 'drag requires focus')
            : null,
          showGraph.value ? h('div', { 'data-testid': 'task-graph-view' }, 'graph') : null,
          showGraphHint.value
            ? h('div', { 'data-testid': 'task-graph-narrow-hint' }, 'graph requires focus')
            : null,
          h(
            'button',
            {
              'data-testid': 'switch-graph',
              onClick: () => {
                viewMode.value = 'graph';
              },
            },
            'graph',
          ),
          h(
            'button',
            {
              'data-testid': 'switch-card',
              onClick: () => {
                viewMode.value = 'card';
              },
            },
            'card',
          ),
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
    setWidth: (value: number) => {
      widthHandle.current = value;
    },
  };
}

describe('Task panel adaptation (V2 §6.2)', () => {
  it('disables drag and shows the maximize hint in the narrow (split) tier', async () => {
    const { wrapper, setWidth } = mountTaskPanelAdaptationProbe(450);

    expect(wrapper.get('[data-testid="enable-drag"]').attributes('data-value')).toBe('false');
    expect(wrapper.find('[data-testid="task-drag-narrow-hint"]').exists()).toBe(true);

    await wrapper.get('[data-testid="switch-graph"]').trigger('click');
    await nextTick();
    expect(wrapper.find('[data-testid="task-graph-view"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="task-graph-narrow-hint"]').exists()).toBe(true);

    // Focus / wide restores drag + graph
    setWidth(1200);
    await nextTick();
    await wrapper.get('[data-testid="switch-card"]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="enable-drag"]').attributes('data-value')).toBe('true');
    expect(wrapper.find('[data-testid="task-drag-narrow-hint"]').exists()).toBe(false);

    await wrapper.get('[data-testid="switch-graph"]').trigger('click');
    await nextTick();
    expect(wrapper.find('[data-testid="task-graph-view"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="task-graph-narrow-hint"]').exists()).toBe(false);

    wrapper.unmount();
  });
});
