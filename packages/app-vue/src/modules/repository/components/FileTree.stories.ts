import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FileTree from './FileTree.vue';

const meta = {
  title: 'Business/Repository/FileTree',
  component: FileTree,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
  },
  args: {
    loading: false,
  },
} satisfies Meta<typeof FileTree>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockNodes = [
  {
    id: 'folder-1',
    name: 'docs',
    type: 'folder' as const,
    parentId: null,
    repositoryId: 'repo-1',
    path: '/docs',
    children: [
      {
        id: 'folder-2',
        name: 'technical',
        type: 'folder' as const,
        parentId: 'folder-1',
        repositoryId: 'repo-1',
        path: '/docs/technical',
        children: [
          {
            id: 'file-1',
            name: 'Architecture.md',
            type: 'file' as const,
            parentId: 'folder-2',
            repositoryId: 'repo-1',
            path: '/docs/technical/Architecture.md',
            extension: 'md',
            size: 8192,
          },
          {
            id: 'file-2',
            name: 'API Reference.md',
            type: 'file' as const,
            parentId: 'folder-2',
            repositoryId: 'repo-1',
            path: '/docs/technical/API Reference.md',
            extension: 'md',
            size: 15360,
          },
        ],
      },
      {
        id: 'file-3',
        name: 'Getting Started.md',
        type: 'file' as const,
        parentId: 'folder-1',
        repositoryId: 'repo-1',
        path: '/docs/Getting Started.md',
        extension: 'md',
        size: 4096,
      },
    ],
  },
  {
    id: 'folder-3',
    name: 'notes',
    type: 'folder' as const,
    parentId: null,
    repositoryId: 'repo-1',
    path: '/notes',
    children: [
      {
        id: 'file-4',
        name: 'Meeting Notes.md',
        type: 'file' as const,
        parentId: 'folder-3',
        repositoryId: 'repo-1',
        path: '/notes/Meeting Notes.md',
        extension: 'md',
        size: 2048,
      },
    ],
  },
  {
    id: 'file-5',
    name: 'README.md',
    type: 'file' as const,
    parentId: null,
    repositoryId: 'repo-1',
    path: '/README.md',
    extension: 'md',
    size: 1024,
  },
];

export const Default: Story = {
  args: {
    repositoryId: 'repo-1',
    nodes: mockNodes,
    selectedId: null,
    expandedIds: ['folder-1'],
  },
};

export const WithSelection: Story = {
  args: {
    repositoryId: 'repo-1',
    nodes: mockNodes,
    selectedId: 'file-1',
    expandedIds: ['folder-1', 'folder-2'],
  },
};

export const AllExpanded: Story = {
  args: {
    repositoryId: 'repo-1',
    nodes: mockNodes,
    selectedId: null,
    expandedIds: ['folder-1', 'folder-2', 'folder-3'],
  },
};

export const Loading: Story = {
  args: {
    repositoryId: 'repo-1',
    nodes: [],
    selectedId: null,
    expandedIds: [],
    loading: true,
  },
};
