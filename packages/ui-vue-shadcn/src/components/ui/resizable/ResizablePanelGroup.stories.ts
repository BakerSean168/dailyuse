import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ResizablePanelGroup } from '.';

const meta = {
  title: 'Atoms/Resizable',
  component: ResizablePanelGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">ResizablePanelGroup story scaffold.</div>',
  }),
};
