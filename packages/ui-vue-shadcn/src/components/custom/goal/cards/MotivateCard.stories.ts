import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MotivateCard from './MotivateCard.vue';

const mockGoals = [
  {
    id: 'goal-1',
    name: '提升团队季度交付效率',
    status: 'Active',
    motivation: '提升团队整体产出能力，减少无效会议和流程瓶颈，让每位成员都能专注于高价值工作。',
    feasibilityAnalysis: '团队已具备基础技术能力，通过引入自动化工具和优化协作流程，预计可在 3 个月内达成目标。',
    keyResults: [],
  },
  {
    id: 'goal-2',
    name: '优化用户留存率',
    status: 'Active',
    motivation: '用户留存是产品长期价值的核心指标，提升留存可以有效降低获客成本并增加用户终身价值。',
    feasibilityAnalysis: '通过分析用户行为数据发现关键流失节点，制定针对性改进措施，目标可行性较高。',
    keyResults: [],
  },
];

const meta = {
  title: 'Business/Goal/Cards/MotivateCard',
  component: MotivateCard,
  tags: ['autodocs'],
  args: {
    goals: mockGoals,
  },
  decorators: [() => ({ template: '<div style="max-width: 400px;"><story /></div>' })],
} satisfies Meta<typeof MotivateCard>;

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

export const SingleGoal: Story = {
  args: {
    goals: [mockGoals[0]],
  },
};

export const NoMotivation: Story = {
  args: {
    goals: [
      {
        id: 'goal-empty',
        name: '目标无动机描述',
        status: 'Active',
        motivation: '',
        feasibilityAnalysis: '',
        keyResults: [],
      },
    ],
  },
};
