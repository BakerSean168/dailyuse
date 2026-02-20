import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ResourceCard from './ResourceCard.vue';

const meta = {
  title: 'Business/Repository/ResourceCard',
  component: ResourceCard,
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof ResourceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

const mockResource = {
  id: 'res-1',
  repositoryId: 'repo-1',
  folderId: 'folder-1',
  name: 'Getting Started Guide.md',
  type: 'markdown' as const,
  mimeType: 'text/markdown',
  path: '/docs/Getting Started Guide.md',
  size: 4096,
  content: null,
  metadata: {},
  stats: {},
  status: 'active' as const,
  createdAt: now - 604800000,
  updatedAt: now - 3600000,
  deletedAt: null,
  version: 5,
  isDeleted: false,
  isArchived: false,
  isActive: true,
  isDraft: false,
  statusText: 'Active',
  typeText: 'Markdown',
  displayName: 'Getting Started Guide',
  formattedSize: '4.0 KB',
  createdAtText: '7 days ago',
  updatedAtText: '1 hour ago',
  extension: 'md',
  icon: 'file-text',
};

export const Default: Story = {
  args: {
    resource: mockResource,
  },
};

export const DraftResource: Story = {
  args: {
    resource: {
      ...mockResource,
      id: 'res-2',
      name: 'Work in Progress.md',
      isDraft: true,
      statusText: 'Draft',
      displayName: 'Work in Progress',
      updatedAtText: 'Just now',
    },
  },
};

export const LargeFile: Story = {
  args: {
    resource: {
      ...mockResource,
      id: 'res-3',
      name: 'Architecture Diagram.png',
      type: 'image' as const,
      mimeType: 'image/png',
      size: 2097152,
      typeText: 'Image',
      displayName: 'Architecture Diagram',
      formattedSize: '2.0 MB',
      extension: 'png',
      icon: 'image',
    },
  },
};
