import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Toaster } from '.';

const meta = {
  title: 'Atoms/Sonner',
  component: Toaster,
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">Toaster story scaffold.</div>',
  }),
};
