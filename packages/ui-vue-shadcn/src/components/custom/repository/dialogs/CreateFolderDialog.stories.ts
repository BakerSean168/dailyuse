import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CreateFolderDialog from './CreateFolderDialog.vue';

const meta = {
  title: 'Business/Repository/Dialogs/CreateFolderDialog',
  component: CreateFolderDialog,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    name: { control: 'text' },
    icon: { control: 'text' },
    parentName: { control: 'text' },
    loading: { control: 'boolean' },
  },
  args: {
    open: true,
    loading: false,
  },
} satisfies Meta<typeof CreateFolderDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { CreateFolderDialog },
    setup: () => ({ args }),
    template: '<CreateFolderDialog v-bind="args" />',
  }),
  args: {},
};

export const WithParentFolder: Story = {
  render: (args) => ({
    components: { CreateFolderDialog },
    setup: () => ({ args }),
    template: '<CreateFolderDialog v-bind="args" />',
  }),
  args: {
    parentId: 'folder-1',
    parentName: 'Research Notes',
  },
};

export const Prefilled: Story = {
  render: (args) => ({
    components: { CreateFolderDialog },
    setup: () => ({ args }),
    template: '<CreateFolderDialog v-bind="args" />',
  }),
  args: {
    name: 'New Project',
    icon: '📁',
    parentName: 'Documents',
  },
};

export const Loading: Story = {
  render: (args) => ({
    components: { CreateFolderDialog },
    setup: () => ({ args }),
    template: '<CreateFolderDialog v-bind="args" />',
  }),
  args: {
    name: 'Creating folder...',
    loading: true,
  },
};
