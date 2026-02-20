import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalProgressChart from './GoalProgressChart.vue';

const mockGoal = {
  id: 'g1',
  title: '提升产品月活用户',
  progress: 65,
  startDate: '2024-01-01',
  endDate: '2024-06-30',
  weightedProgress: 62.5,
  timeProgressPercentage: 50,
  timeProgressRatio: 0.5,
  timeRangeSummary: {
    totalDays: 181,
    elapsedDays: 90,
    remainingDays: 91,
  },
  keyResults: [
    { id: 'kr1', title: '月活达到 50,000', progress: 80, weight: 50 },
    { id: 'kr2', title: '日均使用时长 30 分钟', progress: 50, weight: 50 },
  ],
};

const meta = {
  title: 'Business/Goal/ECharts/GoalProgressChart',
  component: GoalProgressChart,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
  },
} satisfies Meta<typeof GoalProgressChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { GoalProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 200px;"><GoalProgressChart v-bind="args" /></div>',
  }),
};

export const HighProgress: Story = {
  render: (args) => ({
    components: { GoalProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 200px;"><GoalProgressChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      progress: 95,
      weightedProgress: 92,
      timeProgressPercentage: 80,
      timeProgressRatio: 0.8,
    },
  },
};

export const LowProgress: Story = {
  render: (args) => ({
    components: { GoalProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 200px;"><GoalProgressChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      progress: 10,
      weightedProgress: 8,
      timeProgressPercentage: 50,
      timeProgressRatio: 0.5,
    },
  },
};

export const NoGoal: Story = {
  render: (args) => ({
    components: { GoalProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 200px;"><GoalProgressChart v-bind="args" /></div>',
  }),
  args: {
    goal: null,
  },
};
