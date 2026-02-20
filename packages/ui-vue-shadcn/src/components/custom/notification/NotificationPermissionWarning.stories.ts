import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NotificationPermissionWarning from './NotificationPermissionWarning.vue';

const meta = {
  title: 'Business/Notification/NotificationPermissionWarning',
  component: NotificationPermissionWarning,
  tags: ['autodocs'],
  argTypes: {
    showWarning: { control: 'boolean' },
    statusMessage: { control: 'text' },
    canRequestPermission: { control: 'boolean' },
  },
} satisfies Meta<typeof NotificationPermissionWarning>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CanRequest: Story = {
  args: {
    showWarning: true,
    statusMessage: 'Enable browser notifications to receive real-time reminders and updates.',
    canRequestPermission: true,
  },
};

export const CannotRequest: Story = {
  args: {
    showWarning: true,
    statusMessage: 'Notification permission was denied. Please enable it in your browser settings.',
    canRequestPermission: false,
  },
};

export const Hidden: Story = {
  args: {
    showWarning: false,
    statusMessage: 'This should not be visible.',
    canRequestPermission: true,
  },
};
