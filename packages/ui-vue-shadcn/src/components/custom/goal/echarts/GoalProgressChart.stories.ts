import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalProgressChart from './GoalProgressChart.vue';
import { createMockGoal } from '../__stories__/mock-data';

const baseGoal = createMockGoal();

const goalWithDerived = {
  ...baseGoal,
  weightedProgress: 52,
  timeProgressPercentage: 45,
  timeProgressRatio: 0.45,
  timeRangeSummary: { startDate: baseGoal.startDate, endDate: baseGoal.endDate, totalDays: 90, elapsedDays: 40, remainingDays: 50 },
};

const meta = {
  title: 'Business/Goal/Echarts/GoalProgressChart',
  component: GoalProgressChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [() => ({ template: '<div style="height: 200px;"><story /></div>' })],
  argTypes: {
    goal: { description: '含派生指标的目标数据', control: 'object' },
  },
} satisfies Meta<typeof GoalProgressChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AheadOfSchedule: Story = {
  args: { goal: goalWithDerived },
};

export const BehindSchedule: Story = {
  args: {
    goal: { ...goalWithDerived, weightedProgress: 20, timeProgressPercentage: 60, timeProgressRatio: 0.6 },
  },
};

export const Null: Story = {
  args: { goal: null },
};
