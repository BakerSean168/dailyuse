import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KeyResultCard from './KeyResultCard.vue';

const mockKeyResult = {
  id: 'kr-1',
  title: '月活用户达到 50,000',
  description: '通过营销推广和产品优化提升用户活跃度',
  weight: 40,
  progress: { currentValue: 32000, targetValue: 50000 },
};

const mockGoal = {
  id: 'goal-1',
  name: '提升产品用户增长',
  status: 'Active',
  keyResults: [],
};

const meta = {
  title: 'Business/Goal/Cards/KeyResultCard',
  component: KeyResultCard,
  tags: ['autodocs'],
  args: {
    keyResult: mockKeyResult,
    goal: mockGoal,
  },
  decorators: [() => ({ template: '<div style="max-width: 500px;"><story /></div>' })],
} satisfies Meta<typeof KeyResultCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Completed: Story = {
  args: {
    keyResult: {
      id: 'kr-2',
      title: '完成安全审计认证',
      description: '通过 SOC2 Type II 审计',
      weight: 50,
      progress: { currentValue: 100, targetValue: 100 },
    },
  },
};

export const JustStarted: Story = {
  args: {
    keyResult: {
      id: 'kr-3',
      title: '建立数据分析平台',
      description: '搭建实时数据监控和分析系统',
      weight: 30,
      progress: { currentValue: 5, targetValue: 100 },
    },
  },
};

export const NoDescription: Story = {
  args: {
    keyResult: {
      id: 'kr-4',
      title: '缩短平均响应时间至 200ms',
      description: '',
      weight: 20,
      progress: { currentValue: 280, targetValue: 200 },
    },
  },
};

export const WithoutGoal: Story = {
  args: {
    keyResult: mockKeyResult,
    goal: undefined,
  },
};
