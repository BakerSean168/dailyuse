import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { providePanelWidth, usePanelWidth } from '../../../layouts/shell/usePanelWidth';

/**
 * Lightweight probe for S2-Settings panel adaptation (V2 Settings / §7):
 * - narrow (split): group navigation is top horizontal tabs
 * - wide (focus): group navigation is left vertical sidebar
 * - `?tab=` deep-link contract remains the active group selector surface
 *
 * Mirrors UserSettingsView's tier surface without mounting the full settings
 * form (stores/services/file pickers).
 */
function mountSettingsPanelAdaptationProbe(initialWidth: number) {
  const widthHandle: { current: number } = { current: initialWidth };

  const Probe = defineComponent({
    name: 'SettingsPanelAdaptationProbe',
    setup() {
      const { isNarrow } = usePanelWidth();
      const activeTab = ref<'appearance' | 'account'>('appearance');
      const showTabs = computed(() => isNarrow.value);
      const showSidebar = computed(() => !isNarrow.value);

      return () =>
        h(
          'div',
          {
            'data-testid': 'settings-panel-layout',
            'data-narrow': String(isNarrow.value),
          },
          [
            showTabs.value
              ? h('nav', { 'data-testid': 'settings-group-tabs' }, [
                  h(
                    'button',
                    {
                      'data-testid': 'settings-tab-appearance',
                      onClick: () => {
                        activeTab.value = 'appearance';
                      },
                    },
                    'appearance',
                  ),
                  h(
                    'button',
                    {
                      'data-testid': 'settings-tab-account',
                      onClick: () => {
                        activeTab.value = 'account';
                      },
                    },
                    'account',
                  ),
                ])
              : null,
            showSidebar.value
              ? h('nav', { 'data-testid': 'settings-group-sidebar' }, [
                  h(
                    'button',
                    {
                      'data-testid': 'settings-tab-appearance',
                      onClick: () => {
                        activeTab.value = 'appearance';
                      },
                    },
                    'appearance',
                  ),
                  h(
                    'button',
                    {
                      'data-testid': 'settings-tab-account',
                      onClick: () => {
                        activeTab.value = 'account';
                      },
                    },
                    'account',
                  ),
                ])
              : null,
            h('div', { 'data-testid': 'settings-active-tab' }, activeTab.value),
          ],
        );
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

describe('Settings panel adaptation (V2 Settings / §7)', () => {
  it('uses top group tabs in narrow (split) and sidebar groups in wide (focus)', async () => {
    const { wrapper, setWidth } = mountSettingsPanelAdaptationProbe(450);

    expect(wrapper.find('[data-testid="settings-group-tabs"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-group-sidebar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="settings-tab-appearance"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-tab-account"]').exists()).toBe(true);

    await wrapper.get('[data-testid="settings-tab-account"]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="settings-active-tab"]').text()).toBe('account');

    // Focus / wide restores the vertical group sidebar; tab contract remains
    setWidth(1200);
    await nextTick();
    expect(wrapper.find('[data-testid="settings-group-tabs"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="settings-group-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-tab-account"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="settings-active-tab"]').text()).toBe('account');

    wrapper.unmount();
  });
});
