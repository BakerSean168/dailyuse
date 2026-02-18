import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ButtonGroup } from '.';

const meta = {
  title: 'Atoms/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">ButtonGroup story scaffold.</div>',
  }),
};
