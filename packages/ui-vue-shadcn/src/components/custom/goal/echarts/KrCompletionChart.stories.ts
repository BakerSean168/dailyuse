import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KrCompletionChart from './KrCompletionChart.vue';

const mockGoal = {
  id: 'g1',
  title: '提升产品月活用户',
  keyResults: [
    { id: 'kr1', title: '月活达到 50,000', progress: 100, weight: 40 },
    { id: 'kr2', title: '日均使用时长 30 分钟', progress: 60, weight: 30 },
    { id: 'kr3', title: '用户留存率 ≥ 70%', progress: 0, weight: 30 },
  ],
};

const meta = {
  title: 'Business/Goal/ECharts/KrCompletionChart',
  component: KrCompletionChart,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
  },
} satisfies Meta<typeof KrCompletionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { KrCompletionChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 400px; height: 300px;"><KrCompletionChart v-bind="args" /></div>',
  }),
};

export const AllCompleted: Story = {
  render: (args) => ({
    components: { KrCompletionChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 400px; height: 300px;"><KrCompletionChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      keyResults: mockGoal.keyResults.map((kr) => ({ ...kr, progress: 100 })),
    },
  },
};

export const NoneCompleted: Story = {
  render: (args) => ({
    components: { KrCompletionChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 400px; height: 300px;"><KrCompletionChart v-bind="args" /></div>',
  }),
  args: {
    goal: {
      ...mockGoal,
      keyResults: mockGoal.keyResults.map((kr) => ({ ...kr, progress: 0 })),
    },
  },
};

export const NoGoal: Story = {
  render: (args) => ({
    components: { KrCompletionChart },
    setup() {
      return { args };
    },
    template: '<div style="width: 400px; height: 300px;"><KrCompletionChart v-bind="args" /></div>',
  }),
  args: {
    goal: null,
  },
};
