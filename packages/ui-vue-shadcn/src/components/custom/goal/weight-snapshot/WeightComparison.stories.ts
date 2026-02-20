import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeightComparison from './WeightComparison.vue';

const meta = {
  title: 'Business/Goal/WeightSnapshot/WeightComparison',
  component: WeightComparison,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: '权重对比视图。依赖 `useWeightSnapshot()` composable 获取快照数据。' } },
  },
  argTypes: {
    goalId: { description: '目标 ID', control: 'text' },
  },
} satisfies Meta<typeof WeightComparison>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goalId: 'goal-1' },
};
