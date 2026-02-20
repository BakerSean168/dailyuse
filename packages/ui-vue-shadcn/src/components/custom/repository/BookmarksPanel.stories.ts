import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BookmarksPanel from './BookmarksPanel.vue';

const meta = {
  title: 'Business/Repository/BookmarksPanel',
  component: BookmarksPanel,
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof BookmarksPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

const mockBookmarks = [
  {
    id: 'bm-1',
    resourceId: 'res-1',
    identityId: 'user-1',
    aliasName: 'Getting Started Guide',
    icon: '📖',
    color: '#4CAF50',
    sortOrder: 0,
    version: 1,
    createdAt: now - 86400000,
    updatedAt: now - 3600000,
    deletedAt: null,
    displayName: 'Getting Started Guide',
    isOwner: true,
  },
  {
    id: 'bm-2',
    resourceId: 'res-2',
    identityId: 'user-1',
    aliasName: null,
    icon: '🔧',
    color: null,
    sortOrder: 1,
    version: 2,
    createdAt: now - 172800000,
    updatedAt: now - 7200000,
    deletedAt: null,
    displayName: 'API Reference',
    isOwner: true,
  },
  {
    id: 'bm-3',
    resourceId: 'res-3',
    identityId: 'user-1',
    aliasName: 'Project Roadmap',
    icon: null,
    color: '#2196F3',
    sortOrder: 2,
    version: 1,
    createdAt: now - 259200000,
    updatedAt: now - 86400000,
    deletedAt: null,
    displayName: 'Project Roadmap',
    isOwner: false,
  },
];

export const Default: Story = {
  args: {
    bookmarks: mockBookmarks,
  },
};

export const SingleBookmark: Story = {
  args: {
    bookmarks: [mockBookmarks[0]],
  },
};

export const Empty: Story = {
  args: {
    bookmarks: [],
  },
};
