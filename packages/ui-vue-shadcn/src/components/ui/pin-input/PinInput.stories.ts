import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { PinInput } from '.';

const meta = {
  title: 'Atoms/PinInput',
  component: PinInput,
  tags: ['autodocs'],
} satisfies Meta<typeof PinInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">PinInput story scaffold.</div>',
  }),
};
