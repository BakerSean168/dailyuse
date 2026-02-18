import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalDialog from './GoalDialog.vue';

const meta = {
  title: 'Business/Goal/Dialogs/GoalDialog',
  component: GoalDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">GoalDialog story scaffold.</div>',
  }),
};
