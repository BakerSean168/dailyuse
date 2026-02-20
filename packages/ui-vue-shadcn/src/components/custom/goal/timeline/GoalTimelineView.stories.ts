import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalTimelineView from './GoalTimelineView.vue';
import { createMockGoal } from '../__stories__/mock-data';

const meta = {
  title: 'Business/Goal/Timeline/GoalTimelineView',
  component: GoalTimelineView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: '目标时间线视图。依赖 `useGoalTimeline()` composable 获取快照数据。' } },
  },
  decorators: [() => ({ template: '<div style="height: 700px;"><story /></div>' })],
  argTypes: {
    goal: { description: '目标数据', control: 'object' },
  },
} satisfies Meta<typeof GoalTimelineView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goal: createMockGoal() },
};
