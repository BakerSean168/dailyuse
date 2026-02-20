import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FileExplorer from './FileExplorer.vue';

const meta = {
  title: 'Business/Repository/FileExplorer',
  component: FileExplorer,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    isLoading: false,
    error: null,
  },
} satisfies Meta<typeof FileExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

const baseFolderProps = {
  repositoryId: 'repo-1',
  order: 0,
  isExpanded: false,
  metadata: {},
  createdAt: now - 604800000,
  updatedAt: now - 3600000,
  depth: 0,
  isRoot: true,
  hasChildren: true,
  createdAtText: '7 days ago',
  updatedAtText: '1 hour ago',
};

const mockFolders = [
  {
    ...baseFolderProps,
    id: 'folder-1',
    parentId: null,
    name: 'Documents',
    path: '/Documents',
    pathParts: ['Documents'],
    displayName: 'Documents',
    children: [
      {
        ...baseFolderProps,
        id: 'folder-2',
        parentId: 'folder-1',
        name: 'Research',
        path: '/Documents/Research',
        depth: 1,
        isRoot: false,
        hasChildren: false,
        pathParts: ['Documents', 'Research'],
        displayName: 'Research',
        children: null,
      },
    ],
  },
  {
    ...baseFolderProps,
    id: 'folder-3',
    parentId: null,
    name: 'Media',
    path: '/Media',
    hasChildren: false,
    pathParts: ['Media'],
    displayName: 'Media',
    children: null,
  },
];

export const Default: Story = {
  args: {
    selectedRepository: 'repo-1',
    folders: mockFolders,
  },
};

export const WithSelectedFolder: Story = {
  args: {
    selectedRepository: 'repo-1',
    folders: mockFolders,
    selectedFolderId: 'folder-2',
  },
};

export const Loading: Story = {
  args: {
    selectedRepository: 'repo-1',
    folders: [],
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    selectedRepository: 'repo-1',
    folders: [],
    error: 'Failed to load folder structure. Check your connection and try again.',
  },
};
