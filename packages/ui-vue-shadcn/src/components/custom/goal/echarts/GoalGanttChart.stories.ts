import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalGanttChart from './GoalGanttChart.vue';

const mockGoals = [
  {
    id: 'g1',
    title: '提升产品月活用户',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    progress: 75,
    status: 'on_track',
    keyResults: [
      { id: 'kr1', title: '月活达到 50,000', startDate: '2024-01-01', endDate: '2024-04-30', progress: 80 },
      { id: 'kr2', title: '日均使用时长 30 分钟', startDate: '2024-02-01', endDate: '2024-06-30', progress: 70 },
    ],
  },
  {
    id: 'g2',
    title: '优化系统性能',
    startDate: '2024-02-01',
    endDate: '2024-07-31',
    progress: 45,
    status: 'at_risk',
    keyResults: [
      { id: 'kr3', title: 'P99 延迟 ≤ 200ms', startDate: '2024-02-01', endDate: '2024-05-31', progress: 60 },
      { id: 'kr4', title: '可用性 99.9%', startDate: '2024-03-01', endDate: '2024-07-31', progress: 35 },
    ],
  },
  {
    id: 'g3',
    title: '建立数据驱动决策体系',
    startDate: '2024-01-15',
    endDate: '2024-05-31',
    progress: 90,
    status: 'on_track',
    keyResults: [
      { id: 'kr5', title: '数据看板上线', startDate: '2024-01-15', endDate: '2024-03-31', progress: 100 },
      { id: 'kr6', title: '周报自动化覆盖率 80%', startDate: '2024-02-15', endDate: '2024-05-31', progress: 80 },
    ],
  },
];

const meta = {
  title: 'Business/Goal/ECharts/GoalGanttChart',
  component: GoalGanttChart,
  tags: ['autodocs'],
  args: {
    goals: mockGoals,
  },
} satisfies Meta<typeof GoalGanttChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { GoalGanttChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 800px; height: 400px;"><GoalGanttChart v-bind="args" /></div>',
  }),
};

export const SingleGoal: Story = {
  render: (args) => ({
    components: { GoalGanttChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 800px; height: 200px;"><GoalGanttChart v-bind="args" /></div>',
  }),
  args: {
    goals: [mockGoals[0]],
  },
};

export const Empty: Story = {
  render: (args) => ({
    components: { GoalGanttChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 800px; height: 300px;"><GoalGanttChart v-bind="args" /></div>',
  }),
  args: {
    goals: [],
  },
};
