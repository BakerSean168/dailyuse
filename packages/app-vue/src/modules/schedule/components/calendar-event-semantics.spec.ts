/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import type { CalendarEventItem } from '../composables/useCalendarView';
import DayViewCalendar from './DayViewCalendar.vue';
import MonthViewCalendar from './MonthViewCalendar.vue';
import WeekViewCalendar from './WeekViewCalendar.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      schedule: {
        calendar: {
          allDay: 'All day',
          daySun: 'Sun',
          dayMon: 'Mon',
          dayTue: 'Tue',
          dayWed: 'Wed',
          dayThu: 'Thu',
          dayFri: 'Fri',
          daySat: 'Sat',
          openDay: 'Open {date}',
          openEvent: 'Open {title}',
        },
      },
    },
  },
});

const date = new Date(2026, 7, 3, 0, 0, 0, 0);
const event: CalendarEventItem = {
  id: 'event-1',
  title: 'Design review',
  startTime: new Date(2026, 7, 3, 10, 0).getTime(),
  endTime: new Date(2026, 7, 3, 11, 0).getTime(),
  displayMode: 'timed',
  source: 'schedule',
  originalId: 'schedule-1',
};

describe('calendar event semantic controls', () => {
  it.each([
    ['day', DayViewCalendar, { date }],
    ['week', WeekViewCalendar, { startDate: date }],
  ])('exposes the %s timed event as a named native button', async (_, component, props) => {
    const wrapper = mount(component, {
      props: { ...props, schedules: [event] },
      global: { plugins: [i18n] },
    });

    const action = wrapper.get('[data-testid="schedule-event-event-1"]');
    expect(action.element.tagName).toBe('BUTTON');
    expect(action.attributes('type')).toBe('button');
    expect(action.attributes('aria-label')).toBe('Open Design review');

    await action.trigger('click');
    expect(wrapper.emitted('event-click')?.[0]).toEqual([event]);
  });

  it('keeps month event and day actions as separate named buttons', async () => {
    const wrapper = mount(MonthViewCalendar, {
      props: { month: date, schedules: [event] },
      global: { plugins: [i18n] },
    });

    const dayAction = wrapper.get('[data-testid="schedule-day-2026-08-03"]');
    const eventAction = wrapper.get('[data-testid="schedule-event-event-1"]');
    expect(dayAction.element.tagName).toBe('BUTTON');
    expect(dayAction.attributes('aria-label')).toBe('Open 2026-08-03');
    expect(eventAction.element.tagName).toBe('BUTTON');
    expect(eventAction.attributes('aria-label')).toBe('Open Design review');

    await eventAction.trigger('click');
    expect(wrapper.emitted('event-click')?.[0]).toEqual([event]);
    expect(wrapper.emitted('day-click')).toBeUndefined();
  });
});
