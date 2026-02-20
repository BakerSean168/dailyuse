import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NotificationBell from './NotificationBell.vue';

const meta = {
  title: 'Business/Notification/NotificationBell',
  component: NotificationBell,
  tags: ['autodocs'],
  argTypes: {
    unreadCount: { control: { type: 'number', min: 0, max: 200 } },
    loading: { control: 'boolean' },
  },
  args: {
    unreadCount: 0,
    loading: false,
  },
} satisfies Meta<typeof NotificationBell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoUnread: Story = {
  args: { unreadCount: 0 },
};

export const FewUnread: Story = {
  args: { unreadCount: 3 },
};

export const ManyUnread: Story = {
  args: { unreadCount: 42 },
};

export const OverflowCount: Story = {
  args: { unreadCount: 150 },
};

export const Loading: Story = {
  args: { unreadCount: 5, loading: true },
};
