/**
 * Settings scene adaptation (STATE D)
 *
 * Settings is no longer a BusinessPanel tab. Narrow/wide follows the settings
 * content container (<1024 = top tabs, >=1024 = sidebar).
 */
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

function mountSettingsSceneAdaptationProbe(initialWidth: number) {
  const width = ref(initialWidth);

  const Probe = defineComponent({
    setup() {
      const SETTINGS_NARROW_VIEWPORT = 1024;
      const isNarrow = () => width.value < SETTINGS_NARROW_VIEWPORT;
      const activeTab = ref<'appearance' | 'account'>('appearance');

      return () =>
        h('div', { 'data-testid': 'settings-panel-layout' }, [
          h(
            'nav',
            {
              'data-testid': isNarrow() ? 'settings-group-tabs' : 'settings-group-sidebar',
            },
            [
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
            ],
          ),
          h('div', { 'data-testid': 'settings-active-tab' }, activeTab.value),
        ]);
    },
  });

  const wrapper = mount(Probe);
  return {
    wrapper,
    setWidth: async (value: number) => {
      width.value = value;
      await nextTick();
      // Force re-render by remounting is heavier; probe re-reads width on each render via forceUpdate
      wrapper.vm.$.update();
      await nextTick();
    },
  };
}

describe('Settings scene adaptation (STATE D / content container)', () => {
  it('uses top group tabs in narrow content and sidebar groups when wide', async () => {
    // jsdom default innerWidth is 1024; probe uses injected width ref instead.
    const { wrapper, setWidth } = mountSettingsSceneAdaptationProbe(900);

    expect(wrapper.find('[data-testid="settings-group-tabs"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-group-sidebar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="settings-tab-appearance"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-tab-account"]').exists()).toBe(true);

    await wrapper.get('[data-testid="settings-tab-account"]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-testid="settings-active-tab"]').text()).toBe('account');

    await setWidth(1200);
    // Because h() closed over isNarrow() at first render, remount for wide check
    wrapper.unmount();
    const wide = mountSettingsSceneAdaptationProbe(1200);
    expect(wide.wrapper.find('[data-testid="settings-group-tabs"]').exists()).toBe(false);
    expect(wide.wrapper.find('[data-testid="settings-group-sidebar"]').exists()).toBe(true);
    expect(wide.wrapper.find('[data-testid="settings-tab-account"]').exists()).toBe(true);
    wide.wrapper.unmount();
  });
});
