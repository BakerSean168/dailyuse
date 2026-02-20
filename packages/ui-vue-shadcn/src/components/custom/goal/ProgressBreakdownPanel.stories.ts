import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ProgressBreakdownPanel from './ProgressBreakdownPanel.vue';
import type { ProgressBreakdown } from '@dailyuse/contracts/goal';

const mockBreakdown: ProgressBreakdown = {
  totalProgress: 52.5,
  lastUpdateTime: Date.now(),
  krContributions: [
    { keyResultId: 'kr-1', keyResultName: '每日完成3道算法题', weight: 40, progress: 50, contribution: 20 },
    { keyResultId: 'kr-2', keyResultName: '阅读3本技术书籍', weight: 30, progress: 66.7, contribution: 20 },
    { keyResultId: 'kr-3', keyResultName: '完成2个开源贡献', weight: 30, progress: 0, contribution: 0 },
  ],
} as unknown as ProgressBreakdown;

const meta = {
  title: 'Business/Goal/ProgressBreakdownPanel',
  component: ProgressBreakdownPanel,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    breakdown: { description: '进度分解数据', control: 'object' },
    loading: { description: '加载中', control: 'boolean' },
    error: { description: '错误信息', control: 'text' },
  },
} satisfies Meta<typeof ProgressBreakdownPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { breakdown: mockBreakdown, loading: false, error: null },
};

export const Loading: Story = {
  args: { breakdown: null, loading: true, error: null },
};

export const Error: Story = {
  args: { breakdown: null, loading: false, error: '获取进度数据失败，请稍后重试' },
};

export const HighProgress: Story = {
  args: {
    breakdown: {
      totalProgress: 92.3,
      lastUpdateTime: Date.now(),
      krContributions: [
        { keyResultId: 'kr-1', keyResultName: 'API迁移', weight: 60, progress: 95, contribution: 57 },
        { keyResultId: 'kr-2', keyResultName: '文档更新', weight: 40, progress: 88, contribution: 35.2 },
      ],
    } as unknown as ProgressBreakdown,
    loading: false,
    error: null,
  },
};
