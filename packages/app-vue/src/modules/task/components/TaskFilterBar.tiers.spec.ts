/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import type { TaskRelationFilter, TaskStatusFilter, TaskViewMode } from './types';
import TaskFilterBar from './TaskFilterBar.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      task: {
        management: { searchPlaceholder: 'Search task templates' },
        templateMgmt: {
          relationFilterLabel: 'Relations',
          clearFilter: 'Clear filter',
          viewCard: 'Cards',
          viewGraph: 'Graph',
        },
      },
    },
  },
});

describe('TaskFilterBar single responsive DOM', () => {
  it('preserves one search input, its value, and focus across container widths', async () => {
    const status = ref<TaskStatusFilter>('ACTIVE');
    const relation = ref<TaskRelationFilter>('all');
    const search = ref('');
    const viewMode = ref<TaskViewMode>('card');

    const Host = defineComponent({
      setup() {
        return () =>
          h(TaskFilterBar, {
            status: status.value,
            relation: relation.value,
            search: search.value,
            viewMode: viewMode.value,
            statusOptions: [
              { value: 'ACTIVE', label: 'Active', count: 2 },
              { value: 'PAUSED', label: 'Paused', count: 1 },
            ],
            relationOptions: [{ value: 'all', label: 'All relations', count: 3 }],
            'onUpdate:status': (value: TaskStatusFilter) => (status.value = value),
            'onUpdate:relation': (value: TaskRelationFilter) => (relation.value = value),
            'onUpdate:search': (value: string) => (search.value = value),
            'onUpdate:viewMode': (value: TaskViewMode) => (viewMode.value = value),
          });
      },
    });

    const wrapper = mount(Host, { attachTo: document.body, global: { plugins: [i18n] } });
    const input = wrapper.get('[data-testid="task-search-input"]');

    await input.setValue('quarterly review');
    (input.element as HTMLInputElement).focus();
    wrapper.element.setAttribute('style', 'width: 360px');
    await nextTick();
    wrapper.element.setAttribute('style', 'width: 1000px');
    await nextTick();

    expect(wrapper.findAll('[data-testid="task-status-menu"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="task-search-input"]')).toHaveLength(1);
    expect(wrapper.find('[data-testid="task-status-tabs"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="task-search-toggle"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="task-search-input"]').element).toBe(input.element);
    expect(wrapper.get('[data-testid="task-search-input"]').element).toBe(document.activeElement);
    expect((input.element as HTMLInputElement).value).toBe('quarterly review');

    wrapper.unmount();
  });
});
