/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import WindowHeader from './WindowHeader.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { expand: 'Expand', collapse: 'Collapse' },
      nav: {
        capsule: {
          goal: 'Goals',
          task: 'Tasks',
          note: 'Notes',
          reminder: 'Reminders',
          notification: 'Notifications',
        },
      },
      shell: {
        back: 'Back',
        forward: 'Forward',
        showSidePanel: 'Show side panel',
        hideSidePanel: 'Hide side panel',
        moduleNav: 'Module navigation',
        moduleWithCount: '{name}, {count} items',
        previewModule: 'Preview {name}',
        openSchedule: 'Open schedule',
        enterModule: 'Enter',
        previewPlaceholder: 'Preview',
        schedule: { empty: 'Nothing scheduled today' },
        window: { minimize: 'Minimize', maximize: 'Maximize', close: 'Close' },
      },
    },
  },
});

describe('WindowHeader workspace launcher', () => {
  it('uses one workspace launcher instead of persistent module capsules', () => {
    const wrapper = mount(WindowHeader, {
      props: {
        sidebarCollapsed: false,
        rightPanelOpen: true,
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.get('[data-testid="shell-workspace-launcher"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid^="capsule-nav-"]').exists()).toBe(false);
  });

  it('opens the workspace through its single launcher', async () => {
    const wrapper = mount(WindowHeader, {
      props: {
        sidebarCollapsed: false,
        rightPanelOpen: true,
      },
      global: { plugins: [i18n] },
    });

    await wrapper.get('[data-testid="shell-workspace-launcher"]').trigger('click');
    expect(wrapper.emitted('open-workspace')).toHaveLength(1);
  });

  it('exposes a dynamic right-panel toggle without changing sidebar state', async () => {
    const wrapper = mount(WindowHeader, {
      props: {
        sidebarCollapsed: false,
        rightPanelOpen: true,
      },
      global: { plugins: [i18n] },
    });

    const toggle = wrapper.get('[data-testid="shell-right-panel-toggle"]');
    expect(toggle.attributes('aria-label')).toBe('Hide side panel');
    expect(toggle.attributes('aria-pressed')).toBe('true');
    await toggle.trigger('click');
    expect(wrapper.emitted('toggle-right-panel')).toHaveLength(1);
    expect(wrapper.emitted('toggle-sidebar')).toBeUndefined();
  });
});
