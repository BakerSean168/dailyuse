import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Menubar } from '.';

const meta = {
  title: 'Atoms/Menubar',
  component: Menubar,
  tags: ['autodocs'],
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">Menubar story scaffold.</div>',
  }),
};
