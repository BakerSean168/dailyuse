import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CreateFolderDialog from './CreateFolderDialog.vue';

const meta = {
  title: 'Business/Repository/Dialogs/CreateFolderDialog',
  component: CreateFolderDialog,
  tags: ['autodocs'],
} satisfies Meta<typeof CreateFolderDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    template: '<div class="text-sm text-muted-foreground">CreateFolderDialog story scaffold.</div>',
  }),
};
