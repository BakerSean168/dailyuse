import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KeyResultCard from './KeyResultCard.vue';
import { createMockKeyResult } from '../__stories__/mock-data';

const meta = {
  title: 'Business/Goal/Cards/KeyResultCard',
  component: KeyResultCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 480px;"><story /></div>' })],
  argTypes: {
    keyResult: { description: '关键结果数据', control: 'object' },
  },
} satisfies Meta<typeof KeyResultCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {
  args: { keyResult: createMockKeyResult() },
};

export const Completed: Story = {
  args: {
    keyResult: createMockKeyResult({
      title: '阅读3本技术书籍',
      progress: { valueType: 'Number', aggregationMethod: 'SUM', initialValue: 0, targetValue: 3, currentValue: 3, unit: '本' } as any,
      weight: 30,
    }),
  },
};

export const NotStarted: Story = {
  args: {
    keyResult: createMockKeyResult({
      title: '完成2个开源贡献',
      progress: { valueType: 'Number', aggregationMethod: 'SUM', initialValue: 0, targetValue: 2, currentValue: 0, unit: '个' } as any,
      weight: 30,
    }),
  },
};

export const WithDescription: Story = {
  args: {
    keyResult: createMockKeyResult({ description: '在 LeetCode 上完成中等及以上难度的算法题目' }),
  },
};
