import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalTimelineView from './GoalTimelineView.vue';

const meta = {
  title: 'Business/Goal/Timeline/GoalTimelineView',
  component: GoalTimelineView,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalTimelineView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">GoalTimelineView story scaffold.</div>',
  }),
};
