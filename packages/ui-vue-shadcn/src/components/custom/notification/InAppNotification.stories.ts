import type { Meta, StoryObj } from '@storybook/vue3-vite';
import InAppNotification from './InAppNotification.vue';

const meta = {
  title: 'Business/Notification/InAppNotification',
  component: InAppNotification,
  tags: ['autodocs'],
  argTypes: {
    notifications: { control: 'object' },
  },
} satisfies Meta<typeof InAppNotification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleNotification: Story = {
  args: {
    notifications: [
      {
        id: '1',
        title: 'Daily standup in 5 minutes',
        message: 'Join the team standup meeting in the main conference room.',
        type: 'REMINDER',
        priority: 'NORMAL',
      },
    ],
  },
};

export const MultipleNotifications: Story = {
  args: {
    notifications: [
      {
        id: '1',
        title: 'Task completed',
        message: 'Your code review for PR #142 has been approved.',
        type: 'TASK',
        priority: 'NORMAL',
      },
      {
        id: '2',
        title: 'Goal milestone reached',
        message: 'You have completed 80% of your weekly reading goal.',
        type: 'GOAL',
        priority: 'HIGH',
      },
      {
        id: '3',
        title: 'System maintenance',
        message: 'Scheduled maintenance tonight at 2:00 AM.',
        type: 'SYSTEM',
        priority: 'LOW',
      },
    ],
  },
};

export const UrgentNotification: Story = {
  args: {
    notifications: [
      {
        id: '1',
        title: 'Critical: Server alert',
        message: 'API response time exceeded 5s threshold. Immediate action required.',
        type: 'SYSTEM',
        priority: 'URGENT',
      },
    ],
  },
};

export const AllPriorities: Story = {
  args: {
    notifications: [
      { id: '1', title: 'Low priority', message: 'Weekly summary available.', type: 'SYSTEM', priority: 'LOW' },
      { id: '2', title: 'Normal priority', message: 'New comment on your task.', type: 'TASK', priority: 'NORMAL' },
      { id: '3', title: 'High priority', message: 'Deadline approaching tomorrow.', type: 'SCHEDULE', priority: 'HIGH' },
      { id: '4', title: 'Urgent priority', message: 'Action required immediately!', type: 'REMINDER', priority: 'URGENT' },
    ],
  },
};
