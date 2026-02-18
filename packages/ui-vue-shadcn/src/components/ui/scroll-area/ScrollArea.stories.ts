import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ScrollArea } from '.';

const meta = {
  title: 'Atoms/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">ScrollArea story scaffold.</div>',
  }),
};
