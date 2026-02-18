import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalGanttChart from './GoalGanttChart.vue';

const meta = {
  title: 'Business/Goal/Echarts/GoalGanttChart',
  component: GoalGanttChart,
  tags: ['autodocs'],
} satisfies Meta<typeof GoalGanttChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">GoalGanttChart story scaffold.</div>',
  }),
};
