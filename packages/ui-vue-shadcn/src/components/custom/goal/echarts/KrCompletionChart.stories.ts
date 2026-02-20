import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KrCompletionChart from './KrCompletionChart.vue';
import { createMockGoal, createMockKeyResults } from '../__stories__/mock-data';

const goal = createMockGoal();

const meta = {
  title: 'Business/Goal/Echarts/KrCompletionChart',
  component: KrCompletionChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [() => ({ template: '<div style="height: 300px;"><story /></div>' })],
  argTypes: {
    goal: { description: '目标数据', control: 'object' },
  },
} satisfies Meta<typeof KrCompletionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goal },
};

export const AllCompleted: Story = {
  args: {
    goal: {
      ...goal,
      keyResults: createMockKeyResults().map(kr => ({
        ...kr,
        progress: { ...kr.progress, currentValue: kr.progress.targetValue },
      })),
    },
  },
};

export const Null: Story = {
  args: { goal: null },
};
