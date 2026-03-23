import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CreateFolderDialog from './CreateFolderDialog.vue';

const meta = {
  title: 'Business/Repository/Dialogs/CreateFolderDialog',
  component: CreateFolderDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    open: { description: '是否打开', control: 'boolean' },
    name: { description: '文件夹名称', control: 'text' },
    icon: { description: '图标', control: 'text' },
    parentId: { description: '父文件夹 ID', control: 'text' },
    parentName: { description: '父文件夹名称', control: 'text' },
    loading: { description: '加载状态', control: 'boolean' },
  },
} satisfies Meta<typeof CreateFolderDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    name: '',
    icon: '',
    parentId: '',
    parentName: '',
    loading: false,
  },
};

export const WithParent: Story = {
  args: {
    open: true,
    name: '',
    icon: '',
    parentId: 'folder-1',
    parentName: '技术笔记',
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    open: true,
    name: '新建笔记',
    icon: '',
    parentId: '',
    parentName: '',
    loading: true,
  },
};
