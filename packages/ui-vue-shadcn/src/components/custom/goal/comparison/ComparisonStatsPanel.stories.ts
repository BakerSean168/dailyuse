import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ComparisonStatsPanel from './ComparisonStatsPanel.vue';
import { createMockGoals } from '../__stories__/mock-data';

const goals = createMockGoals();

const meta = {
  title: 'Business/Goal/Comparison/ComparisonStatsPanel',
  component: ComparisonStatsPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    goals: { description: '待对比的目标列表', control: 'object' },
  },
} satisfies Meta<typeof ComparisonStatsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goals },
};

export const TwoGoals: Story = {
  args: { goals: goals.slice(0, 2) },
};

export const Empty: Story = {
  args: { goals: [] },
};
