import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WeightSuggestionPanel from './WeightSuggestionPanel.vue';

const meta = {
  title: 'Business/Goal/Weight/WeightSuggestionPanel',
  component: WeightSuggestionPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof WeightSuggestionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">WeightSuggestionPanel story scaffold.</div>',
  }),
};
