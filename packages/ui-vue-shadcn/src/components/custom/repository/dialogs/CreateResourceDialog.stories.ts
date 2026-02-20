import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CreateResourceDialog from './CreateResourceDialog.vue';

const meta = {
  title: 'Business/Repository/Dialogs/CreateResourceDialog',
  component: CreateResourceDialog,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    name: { control: 'text' },
    type: { control: 'text' },
    loading: { control: 'boolean' },
    showFolderSelection: { control: 'boolean' },
  },
  args: {
    open: true,
    loading: false,
    showFolderSelection: false,
  },
} satisfies Meta<typeof CreateResourceDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { CreateResourceDialog },
    setup: () => ({ args }),
    template: '<CreateResourceDialog v-bind="args" />',
  }),
  args: {},
};

export const WithFolder: Story = {
  render: (args) => ({
    components: { CreateResourceDialog },
    setup: () => ({ args }),
    template: '<CreateResourceDialog v-bind="args" />',
  }),
  args: {
    folderId: 'folder-1',
    showFolderSelection: true,
  },
};

export const Prefilled: Story = {
  render: (args) => ({
    components: { CreateResourceDialog },
    setup: () => ({ args }),
    template: '<CreateResourceDialog v-bind="args" />',
  }),
  args: {
    name: 'API Documentation',
    type: 'markdown',
    folderId: 'folder-2',
  },
};

export const Loading: Story = {
  render: (args) => ({
    components: { CreateResourceDialog },
    setup: () => ({ args }),
    template: '<CreateResourceDialog v-bind="args" />',
  }),
  args: {
    name: 'New Resource',
    type: 'markdown',
    loading: true,
  },
};
