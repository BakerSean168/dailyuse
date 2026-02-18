import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Breadcrumb } from '.';

const meta = {
  title: 'Atoms/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">Breadcrumb story scaffold.</div>',
  }),
};
