import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DraggableTaskCard from './DraggableTaskCard.vue';

const meta = {
  title: 'Business/Task/Cards/DraggableTaskCard',
  component: DraggableTaskCard,
  tags: ['autodocs'],
} satisfies Meta<typeof DraggableTaskCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">DraggableTaskCard story scaffold.</div>',
  }),
};
