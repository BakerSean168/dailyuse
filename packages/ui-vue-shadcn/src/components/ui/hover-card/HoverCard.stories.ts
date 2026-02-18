import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { HoverCard } from '.';

const meta = {
  title: 'Atoms/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">HoverCard story scaffold.</div>',
  }),
};
