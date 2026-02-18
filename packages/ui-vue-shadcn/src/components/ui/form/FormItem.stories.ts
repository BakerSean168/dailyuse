import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { FormItem } from '.';

const meta = {
  title: 'Atoms/Form',
  component: FormItem,
  tags: ['autodocs'],
} satisfies Meta<typeof FormItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">FormItem story scaffold.</div>',
  }),
};
