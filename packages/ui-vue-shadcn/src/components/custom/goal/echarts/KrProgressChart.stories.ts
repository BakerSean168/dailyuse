import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KrProgressChart from './KrProgressChart.vue';

const mockGoal = {
  id: 'g1',
  title: '提升产品月活用户',
  keyResults: [
    { id: 'kr1', title: '月活达到 50,000', progress: 80, weight: 40 },
    { id: 'kr2', title: '日均使用时长 30 分钟', progress: 60, weight: 30 },
    { id: 'kr3', title: '用户留存率 ≥ 70%', progress: 45, weight: 30 },
  ],
};

const meta = {
  title: 'Business/Goal/ECharts/KrProgressChart',
  component: KrProgressChart,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
  },
} satisfies Meta<typeof KrProgressChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { KrProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 300px;"><KrProgressChart v-bind="args" /></div>',
  }),
};

export const HighProgress: Story = {
  render: (args) => ({
    components: { KrProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 300px;"><KrProgressChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      keyResults: [
        { id: 'kr1', title: '完成核心功能开发', progress: 95, weight: 50 },
        { id: 'kr2', title: '通过安全审计', progress: 88, weight: 50 },
      ],
    },
  },
};

export const ManyKeyResults: Story = {
  render: (args) => ({
    components: { KrProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 400px;"><KrProgressChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      keyResults: [
        { id: 'kr1', title: '月活达到 50,000', progress: 80, weight: 20 },
        { id: 'kr2', title: '日均使用时长 30 分钟', progress: 60, weight: 20 },
        { id: 'kr3', title: '用户留存率 ≥ 70%', progress: 45, weight: 15 },
        { id: 'kr4', title: 'NPS 评分 ≥ 50', progress: 70, weight: 15 },
        { id: 'kr5', title: '付费转化率 ≥ 5%', progress: 30, weight: 15 },
        { id: 'kr6', title: '客诉率 ≤ 1%', progress: 90, weight: 15 },
      ],
    },
  },
};

export const NoGoal: Story = {
  render: (args) => ({
    components: { KrProgressChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 300px;"><KrProgressChart v-bind="args" /></div>',
  }),
  args: {
    goal: null,
  },
};
