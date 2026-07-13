import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { providePanelWidth, usePanelWidth } from '../../../layouts/shell/usePanelWidth';

/**
 * Lightweight probe for S2-Reminder panel adaptation (V2 §6.4 / §7):
 * - narrow (split): group sidebar collapses to switcher bar; master switch stays in header
 * - wide (focus): full group sidebar restored; master switch still in header
 *
 * Mirrors ReminderLinearView's tier surface without mounting the full view
 * (dialogs/stores/composable network).
 */
function mountReminderPanelAdaptationProbe(initialWidth: number) {
  const widthHandle: { current: number } = { current: initialWidth };

  const Probe = defineComponent({
    name: 'ReminderPanelAdaptationProbe',
    setup() {
      const { isNarrow } = usePanelWidth();
      const selectedGroupId = ref<string | null>(null);
      const showSwitcher = computed(() => isNarrow.value);
      const showSidebar = computed(() => !isNarrow.value);
      // 全局开关任何档位保持面板头可达
      const showMasterSwitch = computed(() => true);

      return () =>
        h('div', { 'data-testid': 'reminder-adaptation-probe' }, [
          showSwitcher.value
            ? h('div', { 'data-testid': 'reminder-group-switcher-bar' }, 'switcher')
            : null,
          showSidebar.value
            ? h('div', { 'data-testid': 'reminder-group-sidebar' }, 'sidebar')
            : null,
          showMasterSwitch.value
            ? h('div', { 'data-testid': 'reminder-master-switch' }, 'master')
            : null,
          h(
            'button',
            {
              'data-testid': 'select-group',
              onClick: () => {
                selectedGroupId.value = 'group-1';
              },
            },
            selectedGroupId.value ?? 'all',
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

describe('Reminder panel adaptation (V2 §6.4)', () => {
  it('shows the group switcher bar and keeps the master switch in the narrow (split) tier', async () => {
    const { wrapper, setWidth } = mountReminderPanelAdaptationProbe(450);

    expect(wrapper.find('[data-testid="reminder-group-switcher-bar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reminder-group-sidebar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="reminder-master-switch"]').exists()).toBe(true);

    // Focus / wide restores the full sidebar; master switch remains reachable
    setWidth(1200);
    await nextTick();
    expect(wrapper.find('[data-testid="reminder-group-switcher-bar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="reminder-group-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reminder-master-switch"]').exists()).toBe(true);

    wrapper.unmount();
  });
});
