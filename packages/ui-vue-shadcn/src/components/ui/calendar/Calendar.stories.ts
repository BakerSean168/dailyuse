import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Calendar } from '.';

const meta = {
  title: 'Atoms/Calendar',
  component: Calendar,
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Calendar },
    template: '<Calendar class="rounded-md border" />',
  }),
};

export const FixedWeeks: Story = {
  render: () => ({
    components: { Calendar },
    template: '<Calendar :fixed-weeks="true" class="rounded-md border" />',
  }),
};
