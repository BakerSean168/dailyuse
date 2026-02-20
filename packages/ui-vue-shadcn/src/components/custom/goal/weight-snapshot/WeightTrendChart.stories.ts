import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeightTrendChart from './WeightTrendChart.vue';

const meta = {
  title: 'Business/Goal/WeightSnapshot/WeightTrendChart',
  component: WeightTrendChart,
  tags: ['autodocs'],
  args: {
    goalId: 'goal-abc-123',
  },
} satisfies Meta<typeof WeightTrendChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { WeightTrendChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><WeightTrendChart v-bind="args" /></div>',
  }),
};

export const DifferentGoal: Story = {
  render: (args) => ({
    components: { WeightTrendChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><WeightTrendChart v-bind="args" /></div>',
  }),
  args: {
    goalId: 'goal-def-456',
  },
};
