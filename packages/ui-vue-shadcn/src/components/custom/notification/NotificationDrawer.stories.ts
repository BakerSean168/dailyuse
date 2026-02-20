import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NotificationDrawer from './NotificationDrawer.vue';

const meta = {
  title: 'Business/Notification/NotificationDrawer',
  component: NotificationDrawer,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'boolean' },
    unreadCount: { control: 'number' },
  },
} satisfies Meta<typeof NotificationDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: (args) => ({
    components: { NotificationDrawer },
    setup: () => ({ args }),
    template: `
      <NotificationDrawer v-bind="args">
        <div class="p-4 text-sm text-muted-foreground text-center">
          Notification content goes here via slot
        </div>
      </NotificationDrawer>
    `,
  }),
  args: { modelValue: true, unreadCount: 5 },
};

export const NoUnread: Story = {
  render: (args) => ({
    components: { NotificationDrawer },
    setup: () => ({ args }),
    template: `
      <NotificationDrawer v-bind="args">
        <div class="p-4 text-sm text-muted-foreground text-center">
          All caught up!
        </div>
      </NotificationDrawer>
    `,
  }),
  args: { modelValue: true, unreadCount: 0 },
};

export const ManyUnread: Story = {
  render: (args) => ({
    components: { NotificationDrawer },
    setup: () => ({ args }),
    template: `
      <NotificationDrawer v-bind="args">
        <div class="p-4 text-sm text-muted-foreground text-center">
          You have many unread notifications
        </div>
      </NotificationDrawer>
    `,
  }),
  args: { modelValue: true, unreadCount: 42 },
};
