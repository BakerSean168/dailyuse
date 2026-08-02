import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import type { TaskTemplateViewModel } from '../types';
import TaskTemplateCard from './TaskTemplateCard.vue';

const passThrough = (name: string, tag = 'div') =>
  defineComponent({
    name,
    setup(_props, { slots, attrs }) {
      return () => h(tag, attrs, slots.default?.());
    },
  });

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      task: {
        templateCard: {
          rollingCompletion: 'Last {days} days {completed}/{due} · {rate}%',
          noExecutionRecords: 'No execution records',
          oneTimeStatus: 'To-do status',
          instanceStatusCompleted: 'Completed',
          instanceStatusNotGenerated: 'Not generated',
        },
      },
      common: { unknown: 'Unknown' },
    },
  },
});

function template(overrides: Partial<TaskTemplateViewModel> = {}): TaskTemplateViewModel {
  return {
    id: 'template-a',
    title: 'Plan',
    status: 'ACTIVE',
    statusText: 'Enabled',
    isActive: true,
    timeConfig: { timeType: 'AllDay', startDate: Date.now() },
    recurrenceRule: { frequency: 'Daily', interval: 1 },
    instanceCount: 12,
    dueInstanceCount: 10,
    completedDueInstanceCount: 8,
    completionWindowDays: 30,
    completionRate: 80,
    ...overrides,
  };
}

function mountCard(value: TaskTemplateViewModel) {
  return mount(TaskTemplateCard, {
    props: { template: value },
    global: {
      plugins: [i18n],
      stubs: {
        ActionableWrapper: passThrough('ActionableWrapper'),
        Card: passThrough('Card'),
        CardHeader: passThrough('CardHeader'),
        CardTitle: passThrough('CardTitle'),
        CardContent: passThrough('CardContent'),
        CardFooter: passThrough('CardFooter'),
        Badge: passThrough('Badge', 'span'),
        Button: passThrough('Button', 'button'),
        Separator: true,
      },
    },
  });
}

describe('TaskTemplateCard completion projection', () => {
  it('shows the due numerator, denominator and percent for the rolling window', () => {
    const wrapper = mountCard(template());

    expect(wrapper.get('[data-testid="task-plan-rolling-completion"]').text()).toBe(
      'Last 30 days 8/10 · 80%',
    );
  });

  it('renders relation filters as keyboard-native buttons', async () => {
    const wrapper = mountCard(
      template({
        parentTaskId: 'parent-a',
        parentTaskTitle: 'Parent plan',
        childCount: 2,
        predecessorCount: 1,
        successorCount: 1,
        isBlocked: true,
      }),
    );

    const controls = [
      'task-card-parent-relation',
      'task-card-children-relation',
      'task-card-predecessors-relation',
      'task-card-successors-relation',
      'task-card-blocked-relation',
    ].map((testId) => wrapper.get(`[data-testid="${testId}"]`));

    for (const control of controls) {
      expect(control.element.tagName).toBe('BUTTON');
      expect(control.attributes('type')).toBe('button');
    }

    await wrapper.get('[data-testid="task-card-children-relation"]').trigger('click');
    expect(wrapper.emitted('relationFilterClick')).toContainEqual(['children']);
  });

  it('shows an empty execution state instead of a misleading zero percent', () => {
    const wrapper = mountCard(
      template({ dueInstanceCount: 0, completedDueInstanceCount: 0, completionRate: 0 }),
    );

    expect(wrapper.get('[data-testid="task-plan-no-execution-records"]').text()).toBe(
      'No execution records',
    );
    expect(wrapper.text()).not.toContain('0%');
  });

  it('shows the sole to-do status and no completion percentage for one-time plans', () => {
    const wrapper = mountCard(
      template({
        recurrenceRule: null,
        instanceCount: 1,
        singleInstanceStatus: 'Completed',
        completionRate: 100,
      }),
    );

    expect(wrapper.get('[data-testid="one-time-task-status"]').text()).toBe('Completed');
    expect(wrapper.find('[data-testid="task-plan-rolling-completion"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('100%');
  });
});
