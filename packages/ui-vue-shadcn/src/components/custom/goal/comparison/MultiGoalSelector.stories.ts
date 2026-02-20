import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MultiGoalSelector from './MultiGoalSelector.vue';
import { createMockGoals } from '../__stories__/mock-data';

const goals = createMockGoals();

const meta = {
  title: 'Business/Goal/Comparison/MultiGoalSelector',
  component: MultiGoalSelector,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    goals: { description: '可选目标列表', control: 'object' },
    minGoals: { description: '最少选择数', control: 'number' },
    maxGoals: { description: '最多选择数', control: 'number' },
  },
} satisfies Meta<typeof MultiGoalSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goals, minGoals: 2, maxGoals: 5 },
};

export const SingleGoalAvailable: Story = {
  args: { goals: [goals[0]], minGoals: 1, maxGoals: 3 },
};

export const Empty: Story = {
  args: { goals: [], minGoals: 2, maxGoals: 5 },
};
