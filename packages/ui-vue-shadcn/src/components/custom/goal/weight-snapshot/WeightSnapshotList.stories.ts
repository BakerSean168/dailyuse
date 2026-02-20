import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeightSnapshotList from './WeightSnapshotList.vue';

const meta = {
  title: 'Business/Goal/WeightSnapshot/WeightSnapshotList',
  component: WeightSnapshotList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: '权重快照列表。依赖 `useWeightSnapshot()` 和 `useGoal()` composable 获取数据。' } },
  },
  argTypes: {
    goalId: { description: '目标 ID', control: 'text' },
  },
} satisfies Meta<typeof WeightSnapshotList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goalId: 'goal-1' },
};
