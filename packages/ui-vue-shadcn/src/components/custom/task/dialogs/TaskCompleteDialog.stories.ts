import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskCompleteDialog from './TaskCompleteDialog.vue';

const meta = {
  title: 'Business/Task/Dialogs/TaskCompleteDialog',
  component: TaskCompleteDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof TaskCompleteDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">TaskCompleteDialog story scaffold.</div>',
  }),
};
