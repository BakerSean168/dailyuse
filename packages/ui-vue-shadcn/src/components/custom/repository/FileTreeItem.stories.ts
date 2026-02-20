import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FileTreeItem from './FileTreeItem.vue';

const meta = {
  title: 'Business/Repository/FileTreeItem',
  component: FileTreeItem,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    openedFolders: [],
    selectedId: null,
  },
} satisfies Meta<typeof FileTreeItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockFolder = {
  id: 'folder-1',
  repositoryId: 'repo-1',
  parentId: null,
  name: 'Documentation',
  path: '/Documentation',
  order: 0,
  isExpanded: false,
  metadata: {},
  createdAt: Date.now() - 604800000,
  updatedAt: Date.now() - 3600000,
  children: [],
  depth: 0,
  isRoot: true,
  hasChildren: true,
  pathParts: ['Documentation'],
  displayName: 'Documentation',
  createdAtText: '7 days ago',
  updatedAtText: '1 hour ago',
};

const mockTreeItem = {
  id: 'folder-1',
  title: 'Documentation',
  children: [
    {
      id: 'folder-2',
      title: 'Technical Guides',
      children: [],
      raw: { ...mockFolder, id: 'folder-2', name: 'Technical Guides', parentId: 'folder-1', hasChildren: false },
    },
    {
      id: 'folder-3',
      title: 'Meeting Notes',
      children: [],
      raw: { ...mockFolder, id: 'folder-3', name: 'Meeting Notes', parentId: 'folder-1', hasChildren: false },
    },
  ],
  raw: mockFolder,
};

export const Collapsed: Story = {
  args: {
    item: mockTreeItem,
    openedFolders: [],
  },
};

export const Expanded: Story = {
  args: {
    item: mockTreeItem,
    openedFolders: ['folder-1'],
  },
};

export const Selected: Story = {
  args: {
    item: mockTreeItem,
    openedFolders: ['folder-1'],
    selectedId: 'folder-2',
  },
};

export const LeafItem: Story = {
  args: {
    item: {
      id: 'folder-4',
      title: 'Empty Folder',
      children: [],
      raw: { ...mockFolder, id: 'folder-4', name: 'Empty Folder', hasChildren: false },
    },
    openedFolders: [],
  },
};
