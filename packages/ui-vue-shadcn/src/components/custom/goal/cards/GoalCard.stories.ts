import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalCard from './GoalCard.vue';

const mockGoal = {
  id: 'goal-1',
  title: '提升团队季度交付效率',
  status: 'IN_PROGRESS',
  statusText: '进行中',
  color: '#3b82f6',
  overallProgress: 65,
  keyResultCount: 4,
  completedKeyResultCount: 2,
  daysRemaining: 23,
  team: '产品团队',
  owner: { name: '张三' },
};

const meta = {
  title: 'Business/Goal/Cards/GoalCard',
  component: GoalCard,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
  },
  decorators: [() => ({ template: '<div style="max-width: 360px;"><story /></div>' })],
} satisfies Meta<typeof GoalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Completed: Story = {
  args: {
    goal: {
      ...mockGoal,
      id: 'goal-2',
      title: '完成 Q1 产品发布',
      status: 'COMPLETED',
      statusText: '已完成',
      color: '#22c55e',
      overallProgress: 100,
      completedKeyResultCount: 4,
      daysRemaining: 0,
    },
  },
};

export const Draft: Story = {
  args: {
    goal: {
      ...mockGoal,
      id: 'goal-3',
      title: '探索新市场机会',
      status: 'DRAFT',
      statusText: '草稿',
      color: '#eab308',
      overallProgress: 12,
      completedKeyResultCount: 0,
      daysRemaining: 60,
    },
  },
};

export const Overdue: Story = {
  args: {
    goal: {
      ...mockGoal,
      id: 'goal-4',
      title: '优化系统性能指标',
      status: 'IN_PROGRESS',
      statusText: '进行中',
      color: '#ef4444',
      overallProgress: 45,
      completedKeyResultCount: 1,
      daysRemaining: -3,
    },
  },
};

export const Archived: Story = {
  args: {
    goal: {
      ...mockGoal,
      id: 'goal-5',
      title: '旧版系统迁移计划',
      status: 'ARCHIVED',
      statusText: '已归档',
      color: '#6b7280',
      overallProgress: 80,
      completedKeyResultCount: 3,
      daysRemaining: 0,
      team: '基础架构',
    },
  },
};
