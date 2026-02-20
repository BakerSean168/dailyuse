import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FileTreePanel from './FileTreePanel.vue';

const meta = {
  title: 'Business/Repository/FileTreePanel',
  component: FileTreePanel,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    showFileInfo: { control: 'boolean' },
    isAllExpanded: { control: 'boolean' },
  },
  args: {
    isLoading: false,
    showFileInfo: false,
    isAllExpanded: false,
  },
} satisfies Meta<typeof FileTreePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockNodes = [
  {
    id: 'folder-1',
    name: 'src',
    type: 'folder' as const,
    parentId: null,
    repositoryId: 'repo-1',
    path: '/src',
    children: [
      {
        id: 'folder-2',
        name: 'components',
        type: 'folder' as const,
        parentId: 'folder-1',
        repositoryId: 'repo-1',
        path: '/src/components',
        children: [
          {
            id: 'file-1',
            name: 'Header.vue',
            type: 'file' as const,
            parentId: 'folder-2',
            repositoryId: 'repo-1',
            path: '/src/components/Header.vue',
            extension: 'vue',
            size: 3072,
          },
        ],
      },
      {
        id: 'file-2',
        name: 'main.ts',
        type: 'file' as const,
        parentId: 'folder-1',
        repositoryId: 'repo-1',
        path: '/src/main.ts',
        extension: 'ts',
        size: 512,
      },
    ],
  },
  {
    id: 'file-3',
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
    nodes: mockNodes,
  },
};

export const WithFileInfo: Story = {
  args: {
    nodes: mockNodes,
    showFileInfo: true,
  },
};

export const Loading: Story = {
  args: {
    nodes: [],
    isLoading: true,
  },
};

export const AllExpanded: Story = {
  args: {
    nodes: mockNodes,
    isAllExpanded: true,
  },
};
