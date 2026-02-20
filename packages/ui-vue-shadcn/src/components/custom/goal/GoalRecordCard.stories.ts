import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalRecordCard from './GoalRecordCard.vue';
import { createMockGoalRecord } from './__stories__/mock-data';

const meta = {
  title: 'Business/Goal/GoalRecordCard',
  component: GoalRecordCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 520px;"><story /></div>' })],
  argTypes: {
    record: { description: '目标记录数据', control: 'object' },
  },
} satisfies Meta<typeof GoalRecordCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithComment: Story = {
  args: { record: createMockGoalRecord() },
};

export const WithoutComment: Story = {
  args: { record: createMockGoalRecord({ comment: null }) },
};

export const HighValue: Story = {
  args: { record: createMockGoalRecord({ value: 10, comment: '大量集中完成' }) },
};
