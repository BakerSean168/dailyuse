import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NotificationPage from './NotificationPage.vue';

const meta = {
  title: 'Business/Notification/NotificationPage',
  component: NotificationPage,
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { NotificationPage },
    template: `
      <NotificationPage>
        <p class="text-sm text-muted-foreground">Notification content would be rendered here via slot.</p>
      </NotificationPage>
    `,
  }),
};

export const WithContent: Story = {
  render: () => ({
    components: { NotificationPage },
    template: `
      <NotificationPage>
        <div class="space-y-4">
          <div class="p-3 border rounded-md">
            <p class="text-sm font-medium">Task completed</p>
            <p class="text-xs text-muted-foreground">Your PR was approved - 5 min ago</p>
          </div>
          <div class="p-3 border rounded-md">
            <p class="text-sm font-medium">Reminder</p>
            <p class="text-xs text-muted-foreground">Daily standup in 10 minutes</p>
          </div>
        </div>
      </NotificationPage>
    `,
  }),
};
