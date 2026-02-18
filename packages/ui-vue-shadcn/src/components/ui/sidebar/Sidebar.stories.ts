import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Sidebar } from '.';

const meta = {
  title: 'Atoms/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">Sidebar story scaffold.</div>',
  }),
};
