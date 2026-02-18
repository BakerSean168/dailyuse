import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Carousel } from '.';

const meta = {
  title: 'Atoms/Carousel',
  component: Carousel,
  tags: ['autodocs'],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">Carousel story scaffold.</div>',
  }),
};
