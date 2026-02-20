import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalInfoShowCard from './GoalInfoShowCard.vue';

const mockKeyResult = {
  id: 'kr-1',
  title: '月活用户达到 50,000',
  description: '通过营销推广提升用户活跃度',
  weight: 40,
  progress: { currentValue: 32000, targetValue: 50000 },
};

const mockGoal = {
  id: 'goal-1',
  name: '提升团队季度交付效率',
  status: 'Active',
  motivation: '提升团队整体产出能力，为公司创造更大价值',
  feasibilityAnalysis: '团队具备技术能力，需要优化流程',
  keyResults: [
    mockKeyResult,
    {
      id: 'kr-2',
      title: '客户满意度达到 4.5 分',
      description: '优化客服和产品质量',
      weight: 30,
      progress: { currentValue: 3.8, targetValue: 4.5 },
    },
    {
      id: 'kr-3',
      title: '缩短平均响应时间至 200ms',
      description: '',
      weight: 30,
      progress: { currentValue: 350, targetValue: 200 },
    },
  ],
};

const meta = {
  title: 'Business/Goal/Cards/GoalInfoShowCard',
  component: GoalInfoShowCard,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
  },
  decorators: [() => ({ template: '<div style="max-width: 700px;"><story /></div>' })],
} satisfies Meta<typeof GoalInfoShowCard>;

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
      name: '完成年度产品发布',
      status: 'Completed',
      keyResults: [
        {
          id: 'kr-done',
          title: '发布 3 个核心功能',
          description: '全部功能已上线并通过验收',
          weight: 100,
          progress: { currentValue: 3, targetValue: 3 },
        },
      ],
    },
  },
};

export const NoKeyResults: Story = {
  args: {
    goal: {
      ...mockGoal,
      id: 'goal-3',
      name: '新创建的目标（暂无关键结果）',
      keyResults: [],
    },
  },
};
