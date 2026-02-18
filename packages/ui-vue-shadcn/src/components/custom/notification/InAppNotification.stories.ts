import type { Meta, StoryObj } from '@storybook/vue3-vite';
import InAppNotification from './InAppNotification.vue';

const meta = {
  title: 'Business/Notification/InAppNotification',
  component: InAppNotification,
  tags: ['autodocs'],
} satisfies Meta<typeof InAppNotification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">InAppNotification story scaffold.</div>',
  }),
};
