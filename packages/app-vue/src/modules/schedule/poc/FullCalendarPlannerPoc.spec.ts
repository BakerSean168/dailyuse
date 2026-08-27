import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import FullCalendarPlannerPoc from './FullCalendarPlannerPoc.vue';

describe('FullCalendarPlannerPoc surface', () => {
  it('renders Standard toolbar views, custom event content, and accessible labels', async () => {
    const wrapper = mount(FullCalendarPlannerPoc, {
      attachTo: document.body,
      props: {
        ownerCommands: { route: vi.fn(async () => ({ status: 'unsupported' as const, message: 'unused' })) },
      },
    });
    await vi.waitFor(() => expect(wrapper.find('[role="tablist"]').exists()).toBe(true));

    expect(wrapper.find('[data-testid="planner-fullcalendar-poc"]').attributes('aria-label')).toBe(
      'FullCalendar Standard Planner proof of concept',
    );
    expect(wrapper.text()).toContain('Week');
    expect(wrapper.text()).toContain('Month');
    expect(wrapper.text()).toContain('List');
    expect(wrapper.text()).toContain('Deep work');
    expect(wrapper.find('.planner-poc-event[aria-label]').exists()).toBe(true);
    const viewButtons = wrapper.findAll('[role="tab"]');
    expect(viewButtons.map((button) => button.attributes('aria-label'))).toEqual([
      'Day view',
      'Week view',
      'Month view',
      'List view',
    ]);
    for (const button of wrapper.findAll('button')) {
      expect(button.attributes('aria-label')).toBeTruthy();
    }
    for (const label of ['Day view', 'Month view', 'List view', 'Week view']) {
      const button = wrapper
        .findAll('[role="tab"]')
        .find((tab) => tab.attributes('aria-label') === label);
      expect(button).toBeDefined();
      await button!.trigger('click');
      await vi.waitFor(() => expect(button!.attributes('aria-selected')).toBe('true'));
    }
    wrapper.unmount();
  });

  it('supports explicit narrow and dark presentation without changing calendar ownership behavior', () => {
    const wrapper = mount(FullCalendarPlannerPoc, {
      props: {
        ownerCommands: { route: vi.fn(async () => ({ status: 'unsupported' as const, message: 'unused' })) },
        narrow: true,
        theme: 'dark',
      },
    });

    expect(wrapper.classes()).toContain('is-narrow');
    expect(wrapper.classes()).toContain('planner-fullcalendar-poc--dark');
    wrapper.unmount();
  });
});
