import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReminderInstanceSidebar from './ReminderInstanceSidebar.vue';

const meta = {
  title: 'Business/Reminder/ReminderInstanceSidebar',
  component: ReminderInstanceSidebar,
  tags: ['autodocs'],
  argTypes: {
    visible: { control: 'boolean' },
    title: { control: 'text' },
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof ReminderInstanceSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

const mockGroupedReminders = [
  {
    date: '2025-01-20',
    dateLabel: 'Today',
    reminders: [
      {
        id: 'rem-1',
        title: 'Drink water',
        message: 'Stay hydrated!',
        priority: 'normal',
        nextTriggerAt: now + 1000 * 60 * 30,
        tags: ['health'],
        isOverdue: false,
        timeLabel: 'In 30 min',
      },
      {
        id: 'rem-2',
        title: 'Team standup',
        message: 'Daily sync with the team',
        priority: 'high',
        nextTriggerAt: now + 1000 * 60 * 60,
        tags: ['work', 'meeting'],
        isOverdue: false,
        timeLabel: 'In 1 hour',
      },
      {
        id: 'rem-3',
        title: 'Take medication',
        message: 'After lunch medication',
        priority: 'urgent',
        nextTriggerAt: now - 1000 * 60 * 15,
        tags: ['health'],
        isOverdue: true,
        timeLabel: '15 min overdue',
      },
    ],
  },
  {
    date: '2025-01-21',
    dateLabel: 'Tomorrow',
    reminders: [
      {
        id: 'rem-4',
        title: 'Code review',
        message: 'Review open PRs',
        priority: 'normal',
        nextTriggerAt: now + 1000 * 60 * 60 * 24,
        tags: ['work'],
        isOverdue: false,
        timeLabel: '9:00 AM',
      },
    ],
  },
];

const mockStats = { total: 12, today: 5, overdue: 1 };

export const Default: Story = {
  args: {
    visible: true,
    title: 'Upcoming Reminders',
    isLoading: false,
    error: null,
    groupedReminders: mockGroupedReminders,
    stats: mockStats,
  },
};

export const Loading: Story = {
  args: {
    visible: true,
    isLoading: true,
    groupedReminders: [],
    stats: null,
  },
};

export const Error: Story = {
  args: {
    visible: true,
    isLoading: false,
    error: 'Failed to fetch reminders. Please check your connection.',
    groupedReminders: [],
    stats: null,
  },
};

export const Empty: Story = {
  args: {
    visible: true,
    isLoading: false,
    groupedReminders: [],
    stats: { total: 0, today: 0, overdue: 0 },
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    groupedReminders: mockGroupedReminders,
    stats: mockStats,
  },
};
