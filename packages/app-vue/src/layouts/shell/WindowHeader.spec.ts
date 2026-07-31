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

describe('WindowHeader accessible navigation names', () => {
  it('keeps the module name when a numeric badge is present', () => {
    const wrapper = mount(WindowHeader, {
      props: {
        sidebarCollapsed: false,
        rightPanelOpen: true,
        activeModule: null,
        unreadCount: 5,
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.get('[data-testid="capsule-nav-notification"]').attributes('aria-label')).toBe(
      'Notifications, 5 items',
    );
    expect(wrapper.get('[data-testid="capsule-nav-goal"]').attributes('aria-label')).toBe('Goals');
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Module navigation');
  });

  it('uses the primary capsule click for navigation and a distinct preview control', async () => {
    const wrapper = mount(WindowHeader, {
      props: {
        sidebarCollapsed: false,
        rightPanelOpen: true,
        activeModule: null,
      },
      global: {
        plugins: [i18n],
        stubs: {
          GoalCapsulePreview: { template: '<div data-testid="goal-preview-stub" />' },
        },
      },
    });

    await wrapper.get('[data-testid="capsule-nav-goal"]').trigger('click');
    expect(wrapper.emitted('enter-module')).toEqual([['goal']]);
    expect(wrapper.find('[data-testid="capsule-preview-goal"]').exists()).toBe(false);

    const previewToggle = wrapper.get('[data-testid="capsule-preview-toggle-goal"]');
    expect(previewToggle.attributes('aria-label')).toBe('Preview Goals');
    await previewToggle.trigger('click');
    expect(wrapper.get('[data-testid="capsule-preview-goal"]').isVisible()).toBe(true);
  });

  it('exposes a dynamic right-panel toggle without changing sidebar state', async () => {
    const wrapper = mount(WindowHeader, {
      props: {
        sidebarCollapsed: false,
        rightPanelOpen: true,
        activeModule: null,
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
