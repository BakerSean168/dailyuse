import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeightSnapshotList from './WeightSnapshotList.vue';

const meta = {
  title: 'Business/Goal/WeightSnapshot/WeightSnapshotList',
  component: WeightSnapshotList,
  tags: ['autodocs'],
  args: {
    goalId: 'goal-abc-123',
  },
  decorators: [() => ({ template: '<div style="max-width: 600px;"><story /></div>' })],
} satisfies Meta<typeof WeightSnapshotList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const DifferentGoal: Story = {
  args: {
    goalId: 'goal-def-456',
  },
};
