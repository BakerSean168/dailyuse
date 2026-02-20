import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TreeNodeItem from './TreeNodeItem.vue';

const meta = {
  title: 'Business/Repository/TreeNodeItem',
  component: TreeNodeItem,
  tags: ['autodocs'],
  argTypes: {
    level: { control: 'number' },
    showFileInfo: { control: 'boolean' },
  },
  args: {
    level: 0,
    showFileInfo: false,
    selectedId: null,
    expandedIds: [],
  },
} satisfies Meta<typeof TreeNodeItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const folderNode = {
  id: 'folder-1',
  name: 'src',
  type: 'folder' as const,
  parentId: null,
  repositoryId: 'repo-1',
  path: '/src',
  children: [
    {
      id: 'file-1',
      name: 'index.ts',
      type: 'file' as const,
      parentId: 'folder-1',
      repositoryId: 'repo-1',
      path: '/src/index.ts',
      extension: 'ts',
      size: 512,
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'file-2',
      name: 'utils.ts',
      type: 'file' as const,
      parentId: 'folder-1',
      repositoryId: 'repo-1',
      path: '/src/utils.ts',
      extension: 'ts',
      size: 2048,
      updatedAt: new Date('2024-01-14'),
    },
  ],
};

const fileNode = {
  id: 'file-3',
  name: 'README.md',
  type: 'file' as const,
  parentId: null,
  repositoryId: 'repo-1',
  path: '/README.md',
  extension: 'md',
  size: 4096,
  updatedAt: new Date('2024-01-15'),
};

export const FolderNode: Story = {
  args: {
    node: folderNode,
    level: 0,
    expandedIds: ['folder-1'],
  },
};

export const FileNodeDefault: Story = {
  args: {
    node: fileNode,
    level: 0,
  },
};

export const WithFileInfo: Story = {
  args: {
    node: fileNode,
    level: 1,
    showFileInfo: true,
  },
};

export const SelectedFile: Story = {
  args: {
    node: fileNode,
    level: 0,
    selectedId: 'file-3',
  },
};
