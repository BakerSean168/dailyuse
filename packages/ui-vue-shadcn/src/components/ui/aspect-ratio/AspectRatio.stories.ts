import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { AspectRatio } from '.';

const meta = {
  title: 'Atoms/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">AspectRatio story scaffold.</div>',
  }),
};
