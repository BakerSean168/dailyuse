import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ComparisonStatsPanel from './ComparisonStatsPanel.vue';

const meta = {
  title: 'Business/Goal/Comparison/ComparisonStatsPanel',
  component: ComparisonStatsPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof ComparisonStatsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">ComparisonStatsPanel story scaffold.</div>',
  }),
};
