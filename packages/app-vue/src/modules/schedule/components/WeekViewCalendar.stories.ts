import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeekViewCalendar from './WeekViewCalendar.vue';
import type { CalendarEventItem } from '../composables/useCalendarView';
import { createCalendarStoryEvent } from './story-fixtures';

const dayStart = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  new Date().getDate(),
).getTime();
const toTimestamp = (dayOffset: number, hour: number, min = 0) =>
  dayStart + dayOffset * 86400000 + hour * 3600000 + min * 60000;

const mockSchedules: CalendarEventItem[] = [
  createCalendarStoryEvent({
    id: 'cal-1',
    title: 'Team Standup',
    startTime: toTimestamp(0, 9),
    endTime: toTimestamp(0, 9, 30),
    source: 'schedule',
  }),
  createCalendarStoryEvent({
    id: 'cal-2',
    title: 'Sprint Planning',
    startTime: toTimestamp(1, 10),
    endTime: toTimestamp(1, 12),
    source: 'goal',
  }),
  createCalendarStoryEvent({
    id: 'cal-3',
    title: 'Design Review',
    startTime: toTimestamp(1, 14),
    endTime: toTimestamp(1, 15),
    hasConflict: true,
    source: 'schedule',
  }),
  createCalendarStoryEvent({
    id: 'cal-4',
    title: '1:1 with Manager',
    startTime: toTimestamp(1, 14, 30),
    endTime: toTimestamp(1, 15, 30),
    hasConflict: true,
    source: 'task',
  }),
  createCalendarStoryEvent({
    id: 'cal-5',
    title: 'Lunch & Learn: TypeScript Tips',
    startTime: toTimestamp(3, 12),
    endTime: toTimestamp(3, 13),
    source: 'schedule',
  }),
];

const meta = {
  title: 'Business/Schedule/WeekViewCalendar',
  component: WeekViewCalendar,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
  },
  args: {
    schedules: mockSchedules,
    loading: false,
  },
} satisfies Meta<typeof WeekViewCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    schedules: mockSchedules,
  },
};

export const Loading: Story = {
  args: {
    schedules: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    schedules: [],
  },
};
