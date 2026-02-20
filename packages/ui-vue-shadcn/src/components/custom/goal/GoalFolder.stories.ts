import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalFolder from './GoalFolder.vue';

const mockFolders = [
  { id: 'folder-1', name: '工作目标', count: 5 },
  { id: 'folder-2', name: '个人成长', count: 3 },
  { id: 'folder-3', name: '健康生活', count: 2 },
  { id: 'folder-4', name: 'Q2 OKR', count: 8 },
];

const meta = {
  title: 'Business/Goal/GoalFolder',
  component: GoalFolder,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 240px;"><story /></div>' })],
  argTypes: {
    goalFolders: { description: '文件夹列表', control: 'object' },
    selectedFolderId: { description: '当前选中的文件夹 ID', control: 'text' },
  },
} satisfies Meta<typeof GoalFolder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goalFolders: mockFolders, selectedFolderId: 'all' },
};

export const FolderSelected: Story = {
  args: { goalFolders: mockFolders, selectedFolderId: 'folder-2' },
};

export const ArchivedSelected: Story = {
  args: { goalFolders: mockFolders, selectedFolderId: 'archived' },
};

export const Empty: Story = {
  args: { goalFolders: [], selectedFolderId: 'all' },
};
