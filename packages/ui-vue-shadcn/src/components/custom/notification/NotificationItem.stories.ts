import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NotificationItem from './NotificationItem.vue';

const meta = {
  title: 'Business/Notification/NotificationItem',
  component: NotificationItem,
  tags: ['autodocs'],
  argTypes: {
    notification: { control: 'object' },
  },
  decorators: [() => ({ template: '<div class="max-w-lg border rounded-lg"><story /></div>' })],
} satisfies Meta<typeof NotificationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

export const Unread: Story = {
  args: {
    notification: {
      id: 'notif-1',
      title: 'New task assigned',
      content: 'You have been assigned to review the authentication module refactoring PR.',
      type: 'TASK',
      importance: 'IMPORTANT',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 15).toISOString(),
    },
  },
};

export const Read: Story = {
  args: {
    notification: {
      id: 'notif-2',
      title: 'Weekly report generated',
      content: 'Your weekly productivity report is ready for review.',
      type: 'SYSTEM',
      importance: 'MODERATE',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
  },
};

export const Vital: Story = {
  args: {
    notification: {
      id: 'notif-3',
      title: 'Critical deadline approaching',
      content: 'The Q4 project milestone is due in 2 hours. Please submit your deliverables.',
      type: 'GOAL',
      importance: 'VITAL',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
    },
  },
};

export const ReminderType: Story = {
  args: {
    notification: {
      id: 'notif-4',
      title: 'Drink water',
      content: 'Time to take a break and stay hydrated!',
      type: 'REMINDER',
      importance: 'MINOR',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 2).toISOString(),
    },
  },
};

export const ScheduleType: Story = {
  args: {
    notification: {
      id: 'notif-5',
      title: 'Meeting at 3 PM',
      content: 'Sprint retrospective with the development team in Room A.',
      type: 'SCHEDULE',
      importance: 'MODERATE',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
  },
};
