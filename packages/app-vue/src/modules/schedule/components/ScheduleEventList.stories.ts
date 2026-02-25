import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScheduleEventList from './ScheduleEventList.vue';
import type { ScheduleJobClientDTO } from '@dailyuse/contracts/schedule';

const now = new Date();
const toISO = (offset: number) => new Date(now.getTime() + offset).toISOString();

const mockSchedules: ScheduleJobClientDTO[] = [
  {
    id: 'sched-1',
    identityId: 'user-1',
    title: 'Team Standup',
    description: 'Daily sync with the team',
    startTime: toISO(3600000),
    endTime: toISO(5400000),
    duration: 1800,
    hasConflict: false,
    priority: 2,
    location: 'Zoom Meeting Room',
    attendees: ['alice@example.com', 'bob@example.com'],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'sched-2',
    identityId: 'user-1',
    title: 'Sprint Planning',
    description: 'Plan the next sprint',
    startTime: toISO(7200000),
    endTime: toISO(14400000),
    duration: 7200,
    hasConflict: true,
    conflictingEntries: ['sched-3'],
    priority: 1,
    location: 'Conference Room B',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'sched-3',
    identityId: 'user-1',
    title: 'Design Review',
    startTime: toISO(10800000),
    endTime: toISO(14400000),
    duration: 3600,
    hasConflict: true,
    conflictingEntries: ['sched-2'],
    priority: 3,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
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
