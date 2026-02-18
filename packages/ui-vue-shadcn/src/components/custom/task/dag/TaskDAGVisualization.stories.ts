import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskDAGVisualization from './TaskDAGVisualization.vue';

const meta = {
  title: 'Business/Task/Dag/TaskDAGVisualization',
  component: TaskDAGVisualization,
  tags: ['autodocs'],
} satisfies Meta<typeof TaskDAGVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">TaskDAGVisualization story scaffold.</div>',
  }),
};
