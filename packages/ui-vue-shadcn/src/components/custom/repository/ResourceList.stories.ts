import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ResourceList from './ResourceList.vue';

const now = new Date().toISOString();

function mockResource(overrides: Record<string, unknown> = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    repositoryId: 'repo-1',
    folderId: 'folder-1',
    name: 'document.md',
    type: 'Markdown',
    mimeType: 'text/markdown',
    path: '/docs/document.md',
    size: 1024,
    content: null,
    metadata: {},
    stats: {},
    status: 'Active',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    isDeleted: false,
    isArchived: false,
    isActive: true,
    isDraft: false,
    statusText: '活跃',
    typeText: 'Markdown',
    displayName: 'document',
    formattedSize: '1 KB',
    createdAtText: '2024-06-01',
    updatedAtText: '2024-12-01',
    extension: '.md',
    icon: 'file-text',
    ...overrides,
  } as any;
}

const meta = {
  title: 'Business/Repository/ResourceList',
  component: ResourceList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    () => ({ template: '<div style="max-width: 600px;"><story /></div>' }),
  ],
  argTypes: {
    resources: { description: '资源列表' },
    selectedId: { description: '选中的资源 ID', control: 'text' },
    bookmarkedIds: { description: '已书签的资源 ID 列表' },
  },
} satisfies Meta<typeof ResourceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    resources: [
      mockResource({ id: 'r1', name: 'README.md', displayName: 'README', path: '/README.md', formattedSize: '2 KB' }),
      mockResource({ id: 'r2', name: 'architecture.md', displayName: 'architecture', path: '/docs/architecture.md', formattedSize: '8 KB' }),
      mockResource({ id: 'r3', name: 'api-reference.md', displayName: 'api-reference', path: '/docs/api-reference.md', formattedSize: '15 KB' }),
      mockResource({ id: 'r4', name: 'deployment-guide.md', displayName: 'deployment-guide', path: '/ops/deployment-guide.md', formattedSize: '4 KB' }),
    ],
    selectedId: 'r1',
    bookmarkedIds: ['r1', 'r3'],
  },
};

export const Empty: Story = {
  args: {
    resources: [],
    selectedId: undefined,
    bookmarkedIds: [],
  },
};

export const NoSelection: Story = {
  args: {
    resources: [
      mockResource({ id: 'r1', name: 'notes.md', displayName: 'notes', formattedSize: '1 KB' }),
      mockResource({ id: 'r2', name: 'todo.md', displayName: 'todo', formattedSize: '512 B' }),
    ],
    selectedId: undefined,
    bookmarkedIds: [],
  },
};
