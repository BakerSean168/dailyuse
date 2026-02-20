import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalRecordCard from './GoalRecordCard.vue';

const meta = {
  title: 'Business/Goal/Cards/GoalRecordCard',
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
      value: 75,
      comment: '完成了用户调研和需求分析工作',
      createdAt: new Date('2024-06-15T10:30:00').toISOString(),
    },
  },
};

export const WithoutComment: Story = {
  args: {
    record: {
      id: 'rec-2',
      value: 30,
      comment: '',
      createdAt: new Date('2024-06-12T08:00:00').toISOString(),
    },
  },
};

export const NumericTimestamp: Story = {
  args: {
    record: {
      id: 'rec-3',
      value: 100,
      comment: '最终验收通过',
      createdAt: Date.now(),
    },
  },
};
