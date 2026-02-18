import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { TagsInput } from '.';

const meta = {
  title: 'Atoms/TagsInput',
  component: TagsInput,
  tags: ['autodocs'],
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">TagsInput story scaffold.</div>',
  }),
};
