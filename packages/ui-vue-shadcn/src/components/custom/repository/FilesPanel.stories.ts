import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FilesPanel from './FilesPanel.vue';

const meta = {
  title: 'Business/Repository/FilesPanel',
  component: FilesPanel,
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
} satisfies Meta<typeof FilesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockNodes = [
  {
    id: 'folder-docs',
    name: 'docs',
    type: 'folder' as const,
    parentId: null,
    repositoryId: 'repo-1',
    path: '/docs',
    children: [
      {
        id: 'file-guide',
        name: 'User Guide.md',
        type: 'file' as const,
        parentId: 'folder-docs',
        repositoryId: 'repo-1',
        path: '/docs/User Guide.md',
        extension: 'md',
        size: 12288,
      },
      {
        id: 'file-changelog',
        name: 'CHANGELOG.md',
        type: 'file' as const,
        parentId: 'folder-docs',
        repositoryId: 'repo-1',
        path: '/docs/CHANGELOG.md',
        extension: 'md',
        size: 8192,
      },
    ],
  },
  {
    id: 'folder-assets',
    name: 'assets',
    type: 'folder' as const,
    parentId: null,
    repositoryId: 'repo-1',
    path: '/assets',
    children: [
      {
        id: 'file-logo',
        name: 'logo.png',
        type: 'file' as const,
        parentId: 'folder-assets',
        repositoryId: 'repo-1',
        path: '/assets/logo.png',
        extension: 'png',
        size: 51200,
      },
    ],
  },
  {
    id: 'file-readme',
    name: 'README.md',
    type: 'file' as const,
    parentId: null,
    repositoryId: 'repo-1',
    path: '/README.md',
    extension: 'md',
    size: 2048,
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

export const Empty: Story = {
  args: {
    nodes: [],
  },
};
