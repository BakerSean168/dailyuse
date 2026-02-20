import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KrWeightDistributionChart from './KrWeightDistributionChart.vue';

const mockGoal = {
  id: 'g1',
  title: '提升产品月活用户',
  keyResults: [
    { id: 'kr1', title: '月活达到 50,000', progress: 80, weight: 40 },
    { id: 'kr2', title: '日均使用时长 30 分钟', progress: 60, weight: 35 },
    { id: 'kr3', title: '用户留存率 ≥ 70%', progress: 45, weight: 25 },
  ],
};

const meta = {
  title: 'Business/Goal/ECharts/KrWeightDistributionChart',
  component: KrWeightDistributionChart,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
  },
} satisfies Meta<typeof KrWeightDistributionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { KrWeightDistributionChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 400px; height: 350px;"><KrWeightDistributionChart v-bind="args" /></div>',
  }),
};

export const EqualWeights: Story = {
  render: (args) => ({
    components: { KrWeightDistributionChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 400px; height: 350px;"><KrWeightDistributionChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      keyResults: [
        { id: 'kr1', title: '目标 A', progress: 50, weight: 33 },
        { id: 'kr2', title: '目标 B', progress: 60, weight: 33 },
        { id: 'kr3', title: '目标 C', progress: 70, weight: 34 },
      ],
    },
  },
};

export const SingleKeyResult: Story = {
  render: (args) => ({
    components: { KrWeightDistributionChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 400px; height: 350px;"><KrWeightDistributionChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      keyResults: [{ id: 'kr1', title: '唯一关键结果', progress: 75, weight: 100 }],
    },
  },
};

export const NoGoal: Story = {
  render: (args) => ({
    components: { KrWeightDistributionChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 400px; height: 350px;"><KrWeightDistributionChart v-bind="args" /></div>',
  }),
  args: {
    goal: null,
  },
};
