import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskTemplateForm from './TaskTemplateForm.vue';

const meta = {
  title: 'Business/Task/TaskTemplateForm/TaskTemplateForm',
  component: TaskTemplateForm,
  tags: ['autodocs'],
} satisfies Meta<typeof TaskTemplateForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">TaskTemplateForm story scaffold.</div>',
  }),
};
