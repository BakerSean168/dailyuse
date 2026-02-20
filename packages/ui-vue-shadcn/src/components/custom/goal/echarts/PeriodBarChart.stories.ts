import type { Meta, StoryObj } from '@storybook/vue3-vite';
import PeriodBarChart from './PeriodBarChart.vue';
import { createMockGoal, createMockRecords } from '../__stories__/mock-data';

const goalWithRecords = {
  ...createMockGoal(),
  records: createMockRecords(12),
};

const meta = {
  title: 'Business/Goal/Echarts/PeriodBarChart',
  component: PeriodBarChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [() => ({ template: '<div style="height: 300px;"><story /></div>' })],
  argTypes: {
    goal: { description: '含记录的目标数据', control: 'object' },
  },
} satisfies Meta<typeof PeriodBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goal: goalWithRecords },
};

export const NoRecords: Story = {
  args: { goal: { ...createMockGoal(), records: [] } },
};

export const Null: Story = {
  args: { goal: null },
};
