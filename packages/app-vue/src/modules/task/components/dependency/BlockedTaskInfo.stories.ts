import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BlockedTaskInfo from './BlockedTaskInfo.vue';

const meta = {
  title: 'Business/Task/Dependency/BlockedTaskInfo',
  component: BlockedTaskInfo,
  tags: ['autodocs'],
} satisfies Meta<typeof BlockedTaskInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">BlockedTaskInfo story scaffold.</div>',
  }),
};
