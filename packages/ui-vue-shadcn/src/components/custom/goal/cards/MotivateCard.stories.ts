import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MotivateCard from './MotivateCard.vue';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

const mockGoals = [
  {
    id: 'goal-1',
    identityId: 'user-1',
    name: '提升编程能力',
    description: '通过系统学习和实践提升编程水平',
    color: '#4CAF50',
    feasibilityAnalysis: '每天投入2小时学习，配合实际项目练习，预计3个月可以达到目标。',
    motivation: '编程能力是核心竞争力，提升后可以更高效地完成工作任务。',
    status: 'Active',
    importance: 'Important',
    priority: 80,
    category: '个人成长',
    tags: ['编程', '学习'],
    startDate: Date.now() - 30 * 86400000,
    targetDate: Date.now() + 60 * 86400000,
    completedAt: null,
    archivedAt: null,
    folderId: null,
    parentGoalId: null,
    sortOrder: 0,
    reminderConfig: null,
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now(),
    deletedAt: null,
    version: 1,
    keyResults: [],
    reviews: [],
  },
  {
    id: 'goal-2',
    identityId: 'user-1',
    name: '健康管理',
    description: '保持良好的健康习惯',
    color: '#FF5722',
    feasibilityAnalysis: '通过合理的运动计划和饮食管理，逐步改善身体状况。',
    motivation: '身体是革命的本钱，健康的身体才能支撑长期的工作和生活。',
    status: 'Active',
    importance: 'Vital',
    priority: 90,
    category: '健康',
    tags: ['健康', '运动'],
    startDate: Date.now() - 15 * 86400000,
    targetDate: Date.now() + 75 * 86400000,
    completedAt: null,
    archivedAt: null,
    folderId: null,
    parentGoalId: null,
    sortOrder: 1,
    reminderConfig: null,
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now(),
    deletedAt: null,
    version: 1,
    keyResults: [],
    reviews: [],
  },
] as unknown as GoalClientDTO[];

const meta = {
  title: 'Business/Goal/Cards/MotivateCard',
  component: MotivateCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 420px;"><story /></div>' })],
  argTypes: {
    goals: { description: '目标列表，随机展示动机或可行性分析', control: 'object' },
  },
} satisfies Meta<typeof MotivateCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goals: mockGoals },
};

export const Empty: Story = {
  args: { goals: [] },
};

export const SingleGoal: Story = {
  args: { goals: [mockGoals[0]] },
};

export const NoContent: Story = {
  args: {
    goals: [{ ...mockGoals[0], motivation: null, feasibilityAnalysis: null }] as unknown as GoalClientDTO[],
  },
};
