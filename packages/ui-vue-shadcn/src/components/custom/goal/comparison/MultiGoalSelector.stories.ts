import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MultiGoalSelector from './MultiGoalSelector.vue';

const mockGoals = [
  { id: 'g1', title: '提升产品月活用户', progress: 75, status: 'on_track' },
  { id: 'g2', title: '优化系统性能', progress: 45, status: 'at_risk' },
  { id: 'g3', title: '建立数据驱动决策体系', progress: 90, status: 'on_track' },
  { id: 'g4', title: '降低运营成本', progress: 20, status: 'behind' },
  { id: 'g5', title: '拓展海外市场业务', progress: 55, status: 'on_track' },
];

const meta = {
  title: 'Business/Goal/Comparison/MultiGoalSelector',
  component: MultiGoalSelector,
  tags: ['autodocs'],
  argTypes: {
    minGoals: { control: { type: 'number', min: 1, max: 10 } },
    maxGoals: { control: { type: 'number', min: 2, max: 10 } },
  },
  args: {
    goals: mockGoals,
    minGoals: 2,
    maxGoals: 4,
  },
  decorators: [() => ({ template: '<div style="max-width: 500px;"><story /></div>' })],
} satisfies Meta<typeof MultiGoalSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {
    goals: [],
  },
};

export const SingleGoalMinimum: Story = {
  args: {
    minGoals: 1,
    maxGoals: 2,
  },
};

export const ManyGoals: Story = {
  args: {
    goals: [
      ...mockGoals,
      { id: 'g6', title: '提升员工满意度', progress: 60, status: 'on_track' },
      { id: 'g7', title: '完善安全合规体系', progress: 35, status: 'at_risk' },
      { id: 'g8', title: '技术架构升级', progress: 80, status: 'on_track' },
    ],
    maxGoals: 6,
  },
};
