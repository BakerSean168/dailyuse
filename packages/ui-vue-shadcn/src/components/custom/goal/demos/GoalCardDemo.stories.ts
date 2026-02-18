import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalCardDemo from './GoalCardDemo.vue';

const meta = {
  title: 'Business/Goal/Demos/GoalCardDemo',
  component: GoalCardDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalCardDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">GoalCardDemo story scaffold.</div>',
  }),
};
