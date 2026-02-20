import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ComparisonStatsPanel from './ComparisonStatsPanel.vue';

const mockGoals = [
  {
    id: 'g1',
    title: '提升产品月活用户',
    progress: 75,
    status: 'on_track',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    keyResults: [
      { id: 'kr1', title: '月活达到 50,000', progress: 80, weight: 50 },
      { id: 'kr2', title: '日均使用时长 30 分钟', progress: 70, weight: 50 },
    ],
  },
  {
    id: 'g2',
    title: '优化系统性能',
    progress: 45,
    status: 'at_risk',
    startDate: '2024-02-01',
    endDate: '2024-07-31',
    keyResults: [
      { id: 'kr3', title: 'P99 延迟 ≤ 200ms', progress: 60, weight: 40 },
      { id: 'kr4', title: '可用性 99.9%', progress: 35, weight: 60 },
    ],
  },
];

const meta = {
  title: 'Business/Goal/Comparison/ComparisonStatsPanel',
  component: ComparisonStatsPanel,
  tags: ['autodocs'],
  args: {
    goals: mockGoals,
  },
  decorators: [() => ({ template: '<div style="max-width: 800px;"><story /></div>' })],
} satisfies Meta<typeof ComparisonStatsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const SingleGoal: Story = {
  args: {
    goals: [mockGoals[0]],
  },
};

export const ManyGoals: Story = {
  args: {
    goals: [
      ...mockGoals,
      {
        id: 'g3',
        title: '建立数据驱动决策体系',
        progress: 90,
        status: 'on_track',
        startDate: '2024-01-15',
        endDate: '2024-05-31',
        keyResults: [
          { id: 'kr5', title: '数据看板上线', progress: 100, weight: 50 },
          { id: 'kr6', title: '周报自动化覆盖率 80%', progress: 80, weight: 50 },
        ],
      },
      {
        id: 'g4',
        title: '降低运营成本',
        progress: 20,
        status: 'behind',
        startDate: '2024-03-01',
        endDate: '2024-12-31',
        keyResults: [
          { id: 'kr7', title: '云资源费用降低 30%', progress: 15, weight: 60 },
          { id: 'kr8', title: '自动化运维覆盖 70%', progress: 28, weight: 40 },
        ],
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    goals: [],
  },
};
