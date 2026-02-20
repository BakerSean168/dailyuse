import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalFolder from './GoalFolder.vue';

const mockFolders = [
  { id: 'folder-1', name: '工作目标', count: 5 },
  { id: 'folder-2', name: '个人成长', count: 3 },
  { id: 'folder-3', name: '健康与生活', count: 2 },
  { id: 'folder-4', name: '学习计划', count: 7 },
];

const meta = {
  title: 'Business/Goal/GoalFolder',
  component: GoalFolder,
  tags: ['autodocs'],
  args: {
    goalFolders: mockFolders,
    selectedFolderId: 'all',
  },
  decorators: [() => ({ template: '<div style="max-width: 240px;"><story /></div>' })],
} satisfies Meta<typeof GoalFolder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const FolderSelected: Story = {
  args: {
    selectedFolderId: 'folder-2',
  },
};

export const ArchivedSelected: Story = {
  args: {
    selectedFolderId: 'archived',
  },
};

export const Empty: Story = {
  args: {
    goalFolders: [],
    selectedFolderId: 'all',
  },
};

export const ManyFolders: Story = {
  args: {
    goalFolders: [
      ...mockFolders,
      { id: 'folder-5', name: '财务规划', count: 4 },
      { id: 'folder-6', name: '团队管理', count: 6 },
      { id: 'folder-7', name: '技术研究', count: 1 },
    ],
  },
};
