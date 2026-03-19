import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BookmarksPanel from './BookmarksPanel.vue';

const now = new Date().toISOString();

function mockBookmark(overrides: Record<string, unknown> = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    resourceId: 'res-1',
    identityId: 'user-1',
    aliasName: '书签',
    icon: null,
    color: null,
    sortOrder: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    displayName: '书签',
    isOwner: true,
    ...overrides,
  } as any;
}

const meta = {
  title: 'Business/Repository/BookmarksPanel',
  component: BookmarksPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [() => ({ template: '<div style="max-width: 320px;"><story /></div>' })],
  argTypes: {
    bookmarks: { description: '书签列表' },
  },
} satisfies Meta<typeof BookmarksPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    bookmarks: [
      mockBookmark({
        id: '1',
        aliasName: 'Vue 3 入门指南',
        displayName: 'Vue 3 入门指南',
        sortOrder: 0,
      }),
      mockBookmark({
        id: '2',
        aliasName: 'TypeScript 最佳实践',
        displayName: 'TypeScript 最佳实践',
        sortOrder: 1,
      }),
      mockBookmark({
        id: '3',
        aliasName: 'Prisma ORM 指南',
        displayName: 'Prisma ORM 指南',
        sortOrder: 2,
      }),
      mockBookmark({ id: '4', aliasName: '部署流程', displayName: '部署流程', sortOrder: 3 }),
    ],
  },
};

export const Empty: Story = {
  args: {
    bookmarks: [],
  },
};

export const SingleBookmark: Story = {
  args: {
    bookmarks: [
      mockBookmark({ id: '1', aliasName: '项目 README', displayName: '项目 README', sortOrder: 0 }),
    ],
  },
};
