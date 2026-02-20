import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeightTrendChart from './WeightTrendChart.vue';

const meta = {
  title: 'Business/Goal/WeightSnapshot/WeightTrendChart',
  component: WeightTrendChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: '权重变化趋势图。依赖 `useWeightSnapshot()` composable 获取数据。' } },
  },
  decorators: [() => ({ template: '<div style="height: 400px;"><story /></div>' })],
  argTypes: {
    goalId: { description: '目标 ID', control: 'text' },
  },
} satisfies Meta<typeof WeightTrendChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goalId: 'goal-1' },
};
