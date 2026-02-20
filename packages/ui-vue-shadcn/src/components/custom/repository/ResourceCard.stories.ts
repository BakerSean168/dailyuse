import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ResourceCard from './ResourceCard.vue';

const now = new Date().toISOString();

function mockResource(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res-1',
    repositoryId: 'repo-1',
    folderId: 'folder-1',
    name: 'README.md',
    type: 'Markdown',
    mimeType: 'text/markdown',
    path: '/docs/README.md',
    size: 2048,
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
    displayName: 'README',
    formattedSize: '2 KB',
    createdAtText: '2024-01-15',
    updatedAtText: '2024-12-01',
    extension: '.md',
    icon: 'file-text',
    ...overrides,
  } as any;
}

const meta = {
  title: 'Business/Repository/ResourceCard',
  component: ResourceCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    () => ({ template: '<div style="width: 360px;"><story /></div>' }),
  ],
  argTypes: {
    resource: { description: '资源数据对象 (ResourceClientDTO)' },
  },
} satisfies Meta<typeof ResourceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Markdown: Story = {
  args: {
    resource: mockResource(),
  },
};

export const Image: Story = {
  args: {
    resource: mockResource({
      id: 'res-2',
      name: 'architecture-diagram.png',
      type: 'Image',
      mimeType: 'image/png',
      path: '/docs/images/architecture-diagram.png',
      size: 524288,
      typeText: '图片',
      displayName: 'architecture-diagram',
      formattedSize: '512 KB',
      extension: '.png',
    }),
  },
};

export const Draft: Story = {
  args: {
    resource: mockResource({
      id: 'res-3',
      name: '草稿笔记.md',
      isDraft: true,
      status: 'Draft',
      statusText: '草稿',
      displayName: '草稿笔记',
    }),
  },
};
