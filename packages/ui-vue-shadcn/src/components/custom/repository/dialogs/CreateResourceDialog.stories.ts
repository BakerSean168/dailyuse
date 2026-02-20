import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CreateResourceDialog from './CreateResourceDialog.vue';

const meta = {
  title: 'Business/Repository/Dialogs/CreateResourceDialog',
  component: CreateResourceDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    open: { description: '是否打开', control: 'boolean' },
    name: { description: '资源名称', control: 'text' },
    type: { description: '资源类型', control: 'select', options: ['MARKDOWN', 'TEXT', 'JSON'] },
    folderId: { description: '目标文件夹 ID', control: 'text' },
    loading: { description: '加载状态', control: 'boolean' },
    showFolderSelection: { description: '显示文件夹选择', control: 'boolean' },
  },
} satisfies Meta<typeof CreateResourceDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    name: '',
    type: 'MARKDOWN',
    folderId: '',
    loading: false,
    showFolderSelection: false,
  },
};

export const WithFolderSelection: Story = {
  args: {
    open: true,
    name: '',
    type: 'MARKDOWN',
    folderId: '',
    loading: false,
    showFolderSelection: true,
  },
};

export const Loading: Story = {
  args: {
    open: true,
    name: '项目说明.md',
    type: 'MARKDOWN',
    folderId: 'folder-1',
    loading: true,
    showFolderSelection: false,
  },
};
