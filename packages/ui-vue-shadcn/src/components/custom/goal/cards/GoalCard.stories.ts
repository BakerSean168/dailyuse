import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalCard from './GoalCard.vue';

const meta = {
  title: 'Business/Goal/Cards/GoalCard',
  component: GoalCard,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">GoalCard story scaffold.</div>',
  }),
};
