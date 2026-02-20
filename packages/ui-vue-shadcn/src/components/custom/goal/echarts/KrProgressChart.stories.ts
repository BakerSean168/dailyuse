import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KrProgressChart from './KrProgressChart.vue';
import { createMockGoal } from '../__stories__/mock-data';

const meta = {
  title: 'Business/Goal/Echarts/KrProgressChart',
  component: KrProgressChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [() => ({ template: '<div style="height: 300px;"><story /></div>' })],
  argTypes: {
    goal: { description: '目标数据', control: 'object' },
  },
} satisfies Meta<typeof KrProgressChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goal: createMockGoal() },
};

export const Null: Story = {
  args: { goal: null },
};
