import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalDAGVisualization from './GoalDAGVisualization.vue';

const meta = {
  title: 'Business/Goal/Dag/GoalDAGVisualization',
  component: GoalDAGVisualization,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: '目标依赖关系 DAG 可视化。依赖 `useGoal()` composable 获取数据。' } },
  },
  decorators: [() => ({ template: '<div style="height: 600px;"><story /></div>' })],
  argTypes: {
    goalId: { description: '目标 ID', control: 'text' },
    syncViewport: { description: '同步视口', control: 'boolean' },
    compact: { description: '紧凑模式', control: 'boolean' },
  },
} satisfies Meta<typeof GoalDAGVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goalId: 'goal-1', syncViewport: false, compact: false },
};

export const Compact: Story = {
  args: { goalId: 'goal-1', syncViewport: false, compact: true },
};
