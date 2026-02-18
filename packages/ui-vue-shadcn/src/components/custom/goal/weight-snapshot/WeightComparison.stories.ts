import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeightComparison from './WeightComparison.vue';

const meta = {
  title: 'Business/Goal/Weight-snapshot/WeightComparison',
  component: WeightComparison,
  tags: ['autodocs'],
} satisfies Meta<typeof WeightComparison>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">WeightComparison story scaffold.</div>',
  }),
};
