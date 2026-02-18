import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Pagination } from '.';

const meta = {
  title: 'Atoms/Pagination',
  component: Pagination,
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">Pagination story scaffold.</div>',
  }),
};
