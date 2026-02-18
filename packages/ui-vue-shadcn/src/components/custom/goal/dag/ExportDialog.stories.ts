import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ExportDialog from './ExportDialog.vue';

const meta = {
  title: 'Business/Goal/Dag/ExportDialog',
  component: ExportDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof ExportDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">ExportDialog story scaffold.</div>',
  }),
};
