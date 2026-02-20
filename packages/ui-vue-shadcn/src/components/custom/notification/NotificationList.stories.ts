import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NotificationList from './NotificationList.vue';

const meta = {
  title: 'Business/Notification/NotificationList',
  component: NotificationList,
  tags: ['autodocs'],
  argTypes: {
    notifications: { control: 'object' },
    loading: { control: 'boolean' },
  },
  decorators: [() => ({ template: '<div class="max-w-lg border rounded-lg"><story /></div>' })],
} satisfies Meta<typeof NotificationList>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

const mockNotifications = [
  {
    id: 'notif-1',
    title: 'New task assigned',
    content: 'You have been assigned to review the authentication module.',
    type: 'TASK',
    importance: 'IMPORTANT',
    isRead: false,
    createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Goal milestone reached',
    content: 'You completed 80% of your monthly reading goal. Keep going!',
    type: 'GOAL',
    importance: 'MODERATE',
    isRead: false,
    createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'System update complete',
    content: 'The application has been updated to version 2.5.0.',
    type: 'SYSTEM',
    importance: 'MINOR',
    isRead: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'notif-4',
    title: 'Drink water reminder',
    content: 'Stay hydrated! Take a short break.',
    type: 'REMINDER',
    importance: 'MINOR',
    isRead: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export const Default: Story = {
  args: {
    notifications: mockNotifications,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    notifications: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    notifications: [],
    loading: false,
  },
};

export const SingleItem: Story = {
  args: {
    notifications: [mockNotifications[0]],
    loading: false,
  },
};
