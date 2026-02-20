import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalRecordCard from './GoalRecordCard.vue';

const meta = {
  title: 'Business/Goal/GoalRecordCard',
  component: GoalRecordCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="max-width: 500px;"><story /></div>' })],
} satisfies Meta<typeof GoalRecordCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    record: {
      id: 'rec-1',
      value: 85,
      comment: '本周完成了 3 个核心功能的开发和测试',
      createdAt: new Date('2024-06-15T10:30:00').toISOString(),
    },
  },
};

export const WithoutComment: Story = {
  args: {
    record: {
      id: 'rec-2',
      value: 42,
      comment: '',
      createdAt: new Date('2024-06-10T14:00:00').toISOString(),
    },
  },
};

export const HighValue: Story = {
  args: {
    record: {
      id: 'rec-3',
      value: 100,
      comment: '里程碑达成！所有目标指标均已满足',
      createdAt: new Date('2024-06-20T09:15:00').toISOString(),
    },
  },
};

export const RecentRecord: Story = {
  args: {
    record: {
      id: 'rec-4',
      value: 15,
      comment: '初始数据录入',
      createdAt: new Date().toISOString(),
    },
  },
};
