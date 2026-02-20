import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalDAGVisualization from './GoalDAGVisualization.vue';

const meta = {
  title: 'Business/Goal/DAG/GoalDAGVisualization',
  component: GoalDAGVisualization,
  tags: ['autodocs'],
  argTypes: {
    syncViewport: { control: 'boolean' },
    compact: { control: 'boolean' },
  },
  args: {
    goalId: 'goal-abc-123',
    syncViewport: false,
    compact: false,
  },
} satisfies Meta<typeof GoalDAGVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { GoalDAGVisualization },
    setup() {
      return { args };
    },
    template: '<div style="width: 800px; height: 500px;"><GoalDAGVisualization v-bind="args" /></div>',
  }),
};

export const Compact: Story = {
  render: (args) => ({
    components: { GoalDAGVisualization },
    setup() {
      return { args };
    },
    template: '<div style="width: 600px; height: 400px;"><GoalDAGVisualization v-bind="args" /></div>',
  }),
  args: {
    compact: true,
  },
};

export const SyncedViewport: Story = {
  render: (args) => ({
    components: { GoalDAGVisualization },
    setup() {
      return { args };
    },
    template: '<div style="width: 800px; height: 500px;"><GoalDAGVisualization v-bind="args" /></div>',
  }),
  args: {
    syncViewport: true,
  },
};

export const DifferentGoal: Story = {
  render: (args) => ({
    components: { GoalDAGVisualization },
    setup() {
      return { args };
    },
    template: '<div style="width: 800px; height: 500px;"><GoalDAGVisualization v-bind="args" /></div>',
  }),
  args: {
    goalId: 'goal-def-456',
  },
};
