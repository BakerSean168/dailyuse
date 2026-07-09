import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScheduleEventList from './ScheduleEventList.vue';
import type { CalendarEntryClientDTO } from '@dailyuse/contracts/schedule';
import { createScheduleStoryEvent } from './story-fixtures';

const now = Date.now();
const toTimestamp = (offset: number) => now + offset;

const mockSchedules: CalendarEntryClientDTO[] = [
  createScheduleStoryEvent({
    title: 'Team Standup',
    description: 'Daily sync with the team',
    startTime: toTimestamp(3600000),
    endTime: toTimestamp(5400000),
    duration: 1800,
    hasConflict: false,
    priority: 2,
    location: 'Zoom Meeting Room',
    attendees: ['alice@example.com', 'bob@example.com'],
  }),
  createScheduleStoryEvent({
    id: 'sched-2',
    title: 'Sprint Planning',
    description: 'Plan the next sprint',
    startTime: toTimestamp(7200000),
    endTime: toTimestamp(14400000),
    duration: 7200,
    hasConflict: true,
    conflictingEntries: ['sched-3'],
    priority: 1,
    location: 'Conference Room B',
  }),
  createScheduleStoryEvent({
    id: 'sched-3',
    title: 'Design Review',
    startTime: toTimestamp(10800000),
    endTime: toTimestamp(14400000),
    duration: 3600,
    hasConflict: true,
    conflictingEntries: ['sched-2'],
    priority: 3,
  }),
];

const meta = {
  title: 'Business/Schedule/ScheduleEventList',
  component: ScheduleEventList,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    schedules: mockSchedules,
    loading: false,
  },
} satisfies Meta<typeof ScheduleEventList>;

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

export const WithError: Story = {
  args: {
    schedules: [],
    error: 'Failed to load schedules.',
  },
};
