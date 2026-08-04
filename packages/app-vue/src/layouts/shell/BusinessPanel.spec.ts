/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import BusinessPanel from './BusinessPanel.vue';
import type { BusinessTab } from './useAppShellStore';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      shell: {
        panel: {
          home: 'Today',
          workflow: 'Workflow',
          closeTab: 'Close tab',
          closeWorkflow: 'Close workflow',
          enterFocus: 'Enter focus',
          exitFocus: 'Exit focus',
          closePanel: 'Close side panel',
          resize: 'Resize business panel',
        },
      },
    },
  },
});

const tabs: BusinessTab[] = [
  {
    id: 'tab-goal-1',
    module: 'goal',
    route: '/goals',
    title: 'Goals',
    lastActiveAt: 1,
  },
];

const StatefulBusinessContent = defineComponent({
  setup() {
    return () => h('input', { 'data-testid': 'business-draft', value: 'preserved draft' });
  },
});

function mountPanel(panelSurface: 'home' | 'business' | 'workflow' = 'home') {
  return mount(BusinessPanel, {
    props: {
      tabs,
      activeTabId: 'tab-goal-1',
      layout: 'split',
      panelSurface,
      workflowAvailable: true,
      workflowAttentionCount: 2,
    },
    slots: {
      home: '<div data-testid="home-surface">Home</div>',
      default: StatefulBusinessContent,
      workflow: '<div data-testid="workflow-surface">Workflow</div>',
    },
    global: { plugins: [i18n] },
  });
}

describe('BusinessPanel surfaces', () => {
  it('renders Home as a surface outside the business tab collection', () => {
    const wrapper = mountPanel();

    expect(wrapper.get('[data-testid="business-panel-home"]').attributes('aria-label')).toBe(
      'Today',
    );
    expect(wrapper.findAll('[data-testid="business-draft"]')).toHaveLength(1);
    expect(wrapper.text()).toContain('Goals');
    expect(tabs).toHaveLength(1);
  });

  it('keeps business content mounted while Home and workflow are active', async () => {
    const wrapper = mountPanel('business');
    const businessElement = wrapper.get('[data-testid="business-draft"]').element;

    await wrapper.setProps({ panelSurface: 'home' });
    expect(wrapper.get('[data-testid="business-draft"]').element).toBe(businessElement);

    await wrapper.setProps({ panelSurface: 'workflow' });
    expect(wrapper.get('[data-testid="business-draft"]').element).toBe(businessElement);
    expect(wrapper.get('[data-testid="workflow-surface"]').exists()).toBe(true);
  });

  it('exposes distinct workflow, Home, focus, and close commands', async () => {
    const wrapper = mountPanel('workflow');

    await wrapper.get('[data-testid="business-panel-home"]').trigger('click');
    await wrapper.get('[data-testid="business-panel-workflow"]').trigger('click');
    await wrapper.get('[data-testid="business-panel-focus-toggle"]').trigger('click');
    await wrapper.get('[data-testid="business-panel-close"]').trigger('click');

    expect(wrapper.emitted('show-home')).toHaveLength(1);
    expect(wrapper.emitted('show-workflow')).toHaveLength(1);
    expect(wrapper.emitted('toggle-focus')).toHaveLength(1);
    expect(wrapper.emitted('close-panel')).toHaveLength(1);
  });

  it('keeps tab and close hit targets at their keyboard-operable minimum sizes', () => {
    const wrapper = mountPanel('business');

    expect(wrapper.get('[aria-current="page"]').classes()).toContain('min-h-9');
    expect(wrapper.get('[data-testid="business-panel-tab-close"]').classes()).toEqual(
      expect.arrayContaining(['h-8', 'w-8']),
    );
    expect(wrapper.get('[data-testid="business-panel-close"]').classes()).toEqual(
      expect.arrayContaining(['h-9', 'w-9']),
    );
  });

  it('exposes the resize handle as a keyboard-operable separator', async () => {
    const wrapper = mountPanel('business');
    const separator = wrapper.get('[data-testid="business-panel-resizer"]');

    expect(separator.attributes()).toMatchObject({
      role: 'separator',
      tabindex: '0',
      'aria-orientation': 'vertical',
      'aria-label': 'Resize business panel',
    });

    await separator.trigger('keydown', { key: 'ArrowLeft' });
    await separator.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('resize-by')).toEqual([[24], [-24]]);
  });
});
