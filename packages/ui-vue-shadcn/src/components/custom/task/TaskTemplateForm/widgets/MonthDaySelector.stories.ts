import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MonthDaySelector from './MonthDaySelector.vue';

const meta = {
  title: 'Business/Task/TaskTemplateForm/Widgets/MonthDaySelector',
  component: MonthDaySelector,
  tags: ['autodocs'],
} satisfies Meta<typeof MonthDaySelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">MonthDaySelector story scaffold.</div>',
  }),
};
