import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { DropdownMenu } from '.';

const meta = {
  title: 'Atoms/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">DropdownMenu story scaffold.</div>',
  }),
};
