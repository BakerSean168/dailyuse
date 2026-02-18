import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ContextMenu } from '.';

const meta = {
  title: 'Atoms/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">ContextMenu story scaffold.</div>',
  }),
};
