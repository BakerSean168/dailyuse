import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ConflictAlert from './ConflictAlert.vue';

const meta = {
  title: 'Business/Schedule/ConflictAlert',
  component: ConflictAlert,
  tags: ['autodocs'],
} satisfies Meta<typeof ConflictAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">ConflictAlert story scaffold.</div>',
  }),
};
