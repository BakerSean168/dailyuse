import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FileTreeNode from './FileTreeNode.vue';

const meta = {
  title: 'Business/Repository/FileTreeNode',
  component: FileTreeNode,
  tags: ['autodocs'],
  argTypes: {
    level: { control: 'number' },
  },
  args: {
    level: 0,
    selectedId: null,
    expandedIds: [],
  },
} satisfies Meta<typeof FileTreeNode>;

export default meta;
type Story = StoryObj<typeof meta>;

const folderNode = {
  id: 'folder-1',
  name: 'docs',
  type: 'folder' as const,
  parentId: null,
  repositoryId: 'repo-1',
  path: '/docs',
  children: [
    {
      id: 'file-1',
      name: 'README.md',
      type: 'file' as const,
      parentId: 'folder-1',
      repositoryId: 'repo-1',
      path: '/docs/README.md',
      extension: 'md',
      size: 2048,
    },
  ],
};

const fileNode = {
  id: 'file-2',
  name: 'Architecture.md',
  type: 'file' as const,
  parentId: null,
  repositoryId: 'repo-1',
  path: '/Architecture.md',
  extension: 'md',
  size: 8192,
};

export const FolderCollapsed: Story = {
  args: {
    node: folderNode,
    level: 0,
    selectedId: null,
    expandedIds: [],
  },
};

export const FolderExpanded: Story = {
  args: {
    node: folderNode,
    level: 0,
    selectedId: null,
    expandedIds: ['folder-1'],
  },
};

export const FileNode: Story = {
  args: {
    node: fileNode,
    level: 1,
    selectedId: null,
    expandedIds: [],
  },
};

export const SelectedNode: Story = {
  args: {
    node: fileNode,
    level: 1,
    selectedId: 'file-2',
    expandedIds: [],
  },
};
