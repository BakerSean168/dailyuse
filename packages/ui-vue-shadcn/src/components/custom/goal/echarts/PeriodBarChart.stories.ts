import type { Meta, StoryObj } from '@storybook/vue3-vite';
import PeriodBarChart from './PeriodBarChart.vue';

const mockGoal = {
  id: 'g1',
  title: '提升产品月活用户',
  startDate: '2024-01-01',
  endDate: '2024-06-30',
  records: [
    { id: 'r1', value: 15, date: '2024-01-15', note: '初始数据录入' },
    { id: 'r2', value: 22, date: '2024-02-10', note: '新功能上线后增长' },
    { id: 'r3', value: 18, date: '2024-02-28', note: '月末汇总' },
    { id: 'r4', value: 30, date: '2024-03-15', note: '活动拉新' },
    { id: 'r5', value: 25, date: '2024-04-01', note: 'Q2 开局' },
    { id: 'r6', value: 35, date: '2024-04-20', note: '产品迭代后' },
    { id: 'r7', value: 28, date: '2024-05-10', note: '稳定增长' },
  ],
  keyResults: [
    { id: 'kr1', title: '月活达到 50,000', progress: 80, weight: 50 },
  ],
};

const meta = {
  title: 'Business/Goal/ECharts/PeriodBarChart',
  component: PeriodBarChart,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
  },
} satisfies Meta<typeof PeriodBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { PeriodBarChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><PeriodBarChart v-bind="args" /></div>',
  }),
};

export const FewRecords: Story = {
  render: (args) => ({
    components: { PeriodBarChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><PeriodBarChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      records: [
        { id: 'r1', value: 10, date: '2024-01-15', note: '首次记录' },
        { id: 'r2', value: 20, date: '2024-03-01', note: '第二次记录' },
      ],
    },
  },
};

export const NoRecords: Story = {
  render: (args) => ({
    components: { PeriodBarChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><PeriodBarChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      records: [],
    },
  },
};

export const NoGoal: Story = {
  render: (args) => ({
    components: { PeriodBarChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 350px;"><PeriodBarChart v-bind="args" /></div>',
  }),
  args: {
    goal: null,
  },
};
