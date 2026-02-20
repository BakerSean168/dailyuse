import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReviewProgressChart from './ReviewProgressChart.vue';
import { createMockGoal, createMockReview } from '../__stories__/mock-data';

const meta = {
  title: 'Business/Goal/Echarts/ReviewProgressChart',
  component: ReviewProgressChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [() => ({ template: '<div style="min-height: 400px;"><story /></div>' })],
  argTypes: {
    review: { description: '评审数据', control: 'object' },
    goal: { description: '目标数据', control: 'object' },
  },
} satisfies Meta<typeof ReviewProgressChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    review: createMockReview(),
    goal: createMockGoal(),
  },
};
