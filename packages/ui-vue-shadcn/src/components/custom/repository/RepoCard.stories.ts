import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RepoCard from './RepoCard.vue';

const meta = {
  title: 'Business/Repository/RepoCard',
  component: RepoCard,
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof RepoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

const mockRepository = {
  id: 'repo-1',
  identityId: 'user-1',
  name: 'Knowledge Base',
  type: 'personal' as const,
  path: '/repos/knowledge-base',
  description: 'A comprehensive knowledge base for organizing research notes, technical documentation, and project references.',
  config: {},
  stats: {},
  status: 'active' as const,
  version: 3,
  createdAt: now - 2592000000,
  updatedAt: now - 3600000,
  deletedAt: null,
  isDeleted: false,
  isArchived: false,
  isActive: true,
  statusText: 'Active',
  typeText: 'Personal',
  folderCount: 12,
  resourceCount: 87,
  totalSize: 5242880,
  formattedSize: '5.0 MB',
  createdAtText: '30 days ago',
  updatedAtText: '1 hour ago',
};

export const Default: Story = {
  args: {
    repository: mockRepository,
  },
};

export const ArchivedRepo: Story = {
  args: {
    repository: {
      ...mockRepository,
      id: 'repo-2',
      name: 'Legacy Documentation',
      status: 'archived' as const,
      isArchived: true,
      isActive: false,
      statusText: 'Archived',
      description: 'Archived documentation from the previous version of the platform.',
      resourceCount: 234,
      folderCount: 28,
    },
  },
};

export const EmptyRepo: Story = {
  args: {
    repository: {
      ...mockRepository,
      id: 'repo-3',
      name: 'New Project',
      description: null,
      folderCount: 0,
      resourceCount: 0,
      totalSize: 0,
      formattedSize: '0 B',
      createdAtText: 'Just now',
      updatedAtText: 'Just now',
    },
  },
};
