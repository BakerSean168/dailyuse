import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeekViewCalendar from './WeekViewCalendar.vue';
import type { ScheduleJobClientDTO } from '@dailyuse/contracts/schedule';

const now = Date.now();
const dayStart = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  new Date().getDate(),
).getTime();
const toTimestamp = (dayOffset: number, hour: number, min = 0) =>
  dayStart + dayOffset * 86400000 + hour * 3600000 + min * 60000;

const mockSchedules: ScheduleJobClientDTO[] = [
  {
    id: 'cal-1',
    identityId: 'user-1',
    title: 'Team Standup',
    description: 'Daily sync',
    startTime: toTimestamp(0, 9),
    endTime: toTimestamp(0, 9, 30),
    duration: 1800,
    hasConflict: false,
    priority: 2,
    location: 'Zoom',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cal-2',
    identityId: 'user-1',
    title: 'Sprint Planning',
    description: 'Plan next sprint stories',
    startTime: toTimestamp(1, 10),
    endTime: toTimestamp(1, 12),
    duration: 7200,
    hasConflict: false,
    priority: 1,
    location: 'Conference Room A',
    attendees: ['alice@example.com', 'charlie@example.com'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cal-3',
    identityId: 'user-1',
    title: 'Design Review',
    startTime: toTimestamp(1, 14),
    endTime: toTimestamp(1, 15),
    duration: 3600,
    hasConflict: true,
    conflictingEntries: ['cal-4'],
    priority: 3,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cal-4',
    identityId: 'user-1',
    title: '1:1 with Manager',
    startTime: toTimestamp(1, 14, 30),
    endTime: toTimestamp(1, 15, 30),
    duration: 3600,
    hasConflict: true,
    conflictingEntries: ['cal-3'],
    priority: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cal-5',
    identityId: 'user-1',
    title: 'Lunch & Learn: TypeScript Tips',
    startTime: toTimestamp(3, 12),
    endTime: toTimestamp(3, 13),
    duration: 3600,
    hasConflict: false,
    priority: 4,
    location: 'Cafeteria',
    createdAt: now,
    updatedAt: now,
  },
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
