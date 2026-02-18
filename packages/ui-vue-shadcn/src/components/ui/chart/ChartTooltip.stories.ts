import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ChartTooltip } from '.';

const meta = {
  title: 'Atoms/Chart',
  component: ChartTooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof ChartTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">ChartTooltip story scaffold.</div>',
  }),
};
