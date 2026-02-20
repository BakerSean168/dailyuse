import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalGanttChart from './GoalGanttChart.vue';
import { createMockGoals } from '../__stories__/mock-data';

const meta = {
  title: 'Business/Goal/Echarts/GoalGanttChart',
  component: GoalGanttChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [() => ({ template: '<div style="height: 400px;"><story /></div>' })],
  argTypes: {
    goals: { description: '目标列表', control: 'object' },
  },
} satisfies Meta<typeof GoalGanttChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goals: createMockGoals() },
};

export const SingleGoal: Story = {
  args: { goals: [createMockGoals()[0]] },
};

export const Empty: Story = {
  args: { goals: [] },
};
