import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ResourceList from './ResourceList.vue';

const meta = {
  title: 'Business/Repository/ResourceList',
  component: ResourceList,
  tags: ['autodocs'],
  argTypes: {
    selectedId: { control: 'text' },
  },
  args: {},
} satisfies Meta<typeof ResourceList>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

const baseResource = {
  repositoryId: 'repo-1',
  folderId: 'folder-1',
  content: null,
  metadata: {},
  stats: {},
  status: 'active' as const,
  deletedAt: null,
  version: 1,
  isDeleted: false,
  isArchived: false,
  isActive: true,
  isDraft: false,
  statusText: 'Active',
};

const mockResources = [
  {
    ...baseResource,
    id: 'res-1',
    name: 'README.md',
    type: 'markdown' as const,
    mimeType: 'text/markdown',
    path: '/README.md',
    size: 2048,
    typeText: 'Markdown',
    displayName: 'README',
    formattedSize: '2.0 KB',
    createdAt: now - 604800000,
    updatedAt: now - 3600000,
    createdAtText: '7 days ago',
    updatedAtText: '1 hour ago',
    extension: 'md',
    icon: 'file-text',
  },
  {
    ...baseResource,
    id: 'res-2',
    name: 'Architecture.md',
    type: 'markdown' as const,
    mimeType: 'text/markdown',
    path: '/docs/Architecture.md',
    size: 8192,
    typeText: 'Markdown',
    displayName: 'Architecture',
    formattedSize: '8.0 KB',
    createdAt: now - 1209600000,
    updatedAt: now - 86400000,
    createdAtText: '14 days ago',
    updatedAtText: '1 day ago',
    extension: 'md',
    icon: 'file-text',
  },
  {
    ...baseResource,
    id: 'res-3',
    name: 'Meeting Notes 2024.md',
    type: 'markdown' as const,
    mimeType: 'text/markdown',
    path: '/notes/Meeting Notes 2024.md',
    size: 15360,
    typeText: 'Markdown',
    displayName: 'Meeting Notes 2024',
    formattedSize: '15.0 KB',
    createdAt: now - 2592000000,
    updatedAt: now - 7200000,
    createdAtText: '30 days ago',
    updatedAtText: '2 hours ago',
    extension: 'md',
    icon: 'file-text',
  },
];

export const Default: Story = {
  args: {
    resources: mockResources,
  },
};

export const WithSelection: Story = {
  args: {
    resources: mockResources,
    selectedId: 'res-2',
  },
};

export const WithBookmarks: Story = {
  args: {
    resources: mockResources,
    selectedId: 'res-1',
    bookmarkedIds: ['res-1', 'res-3'],
  },
};

export const Empty: Story = {
  args: {
    resources: [],
  },
};
