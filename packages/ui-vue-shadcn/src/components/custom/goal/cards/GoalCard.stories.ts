import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalCard from './GoalCard.vue';
import { createLinearGoalCard } from '../__stories__/mock-data';

const meta = {
  title: 'Business/Goal/Cards/GoalCard',
  component: GoalCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 360px;"><story /></div>' })],
  argTypes: {
    goal: { description: 'Linear 风格目标卡片数据', control: 'object' },
  },
} satisfies Meta<typeof GoalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: { goal: createLinearGoalCard() },
};

export const Completed: Story = {
  args: {
    goal: createLinearGoalCard({
      status: 'COMPLETED',
      statusText: '已完成',
      overallProgress: 100,
      completedKeyResultCount: 3,
      daysRemaining: 0,
    }),
  },
};

export const Draft: Story = {
  args: {
    goal: createLinearGoalCard({
      status: 'DRAFT',
      statusText: '草稿',
      overallProgress: 10,
      daysRemaining: 45,
    }),
  },
};

export const Archived: Story = {
  args: {
    goal: createLinearGoalCard({
      status: 'ARCHIVED',
      statusText: '已归档',
      overallProgress: 80,
      daysRemaining: -5,
    }),
  },
};

export const UrgentDeadline: Story = {
  args: {
    goal: createLinearGoalCard({
      daysRemaining: 3,
      overallProgress: 30,
    }),
  },
};
