import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Sheet } from '.';

const meta = {
  title: 'Atoms/Sheet',
  component: Sheet,
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">Sheet story scaffold.</div>',
  }),
};
