import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ProgressBreakdownPanel from './ProgressBreakdownPanel.vue';

const mockBreakdown = {
  totalProgress: 62.5,
  lastUpdateTime: Date.now() - 3600000,
  krContributions: [
    {
      keyResultId: 'kr-1',
      keyResultName: '月活用户达到 50,000',
      progress: 80,
      weight: 40,
      contribution: 32,
    },
    {
      keyResultId: 'kr-2',
      keyResultName: '客户满意度达到 4.5 分',
      progress: 60,
      weight: 30,
      contribution: 18,
    },
    {
      keyResultId: 'kr-3',
      keyResultName: '平均响应时间 ≤ 200ms',
      progress: 41.67,
      weight: 30,
      contribution: 12.5,
    },
  ],
};

const meta = {
  title: 'Business/Goal/ProgressBreakdownPanel',
  component: ProgressBreakdownPanel,
  tags: ['autodocs'],
  args: {
    breakdown: mockBreakdown,
    loading: false,
    error: null,
  },
  decorators: [() => ({ template: '<div style="max-width: 600px;"><story /></div>' })],
} satisfies Meta<typeof ProgressBreakdownPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    breakdown: null,
    loading: true,
  },
};

export const Error: Story = {
  args: {
    breakdown: null,
    error: '无法加载进度数据，请检查网络连接后重试',
  },
};

export const HighProgress: Story = {
  args: {
    breakdown: {
      totalProgress: 92.3,
      lastUpdateTime: Date.now(),
      krContributions: [
        {
          keyResultId: 'kr-1',
          keyResultName: '完成核心功能开发',
          progress: 95,
          weight: 50,
          contribution: 47.5,
        },
        {
          keyResultId: 'kr-2',
          keyResultName: '通过安全审计',
          progress: 88,
          weight: 50,
          contribution: 44,
        },
      ],
    },
  },
};

export const LowProgress: Story = {
  args: {
    breakdown: {
      totalProgress: 15.0,
      lastUpdateTime: Date.now() - 86400000,
      krContributions: [
        {
          keyResultId: 'kr-1',
          keyResultName: '招聘新团队成员',
          progress: 20,
          weight: 60,
          contribution: 12,
        },
        {
          keyResultId: 'kr-2',
          keyResultName: '搭建培训体系',
          progress: 7.5,
          weight: 40,
          contribution: 3,
        },
      ],
    },
  },
};
