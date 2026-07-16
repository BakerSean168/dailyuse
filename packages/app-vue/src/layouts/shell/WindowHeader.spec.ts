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
        moduleNav: 'Module navigation',
        moduleWithCount: '{name}, {count} items',
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
        activeModule: null,
        unreadCount: 5,
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.get('[data-testid="capsule-nav-notification"]').attributes('aria-label')).toBe(
      'Notifications, 5 items',
    );
    expect(wrapper.get('[data-testid="capsule-nav-goal"]').attributes('aria-label')).toBe(
      'Goals',
    );
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Module navigation');
  });
});
