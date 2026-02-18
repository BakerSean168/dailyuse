import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { RangeCalendar } from '.';

const meta = {
  title: 'Atoms/RangeCalendar',
  component: RangeCalendar,
  tags: ['autodocs'],
} satisfies Meta<typeof RangeCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">RangeCalendar story scaffold.</div>',
  }),
};
