import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Calendar } from '.';

const meta: Meta<typeof Calendar> = {
  title: 'Atoms/Calendar',
  component: Calendar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

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
