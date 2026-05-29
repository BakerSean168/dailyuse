import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorTabBar from './EditorTabBar.vue';
import type { EditorTab } from '../types';

const mockTabs = [
  { id: 'tab-1', fileName: 'welcome.md', filePath: '/notes/welcome.md', isDirty: false },
  { id: 'tab-2', fileName: 'todo.md', filePath: '/notes/todo.md', isDirty: true },
  { id: 'tab-3', fileName: 'config.json', filePath: '/config.json', isDirty: false },
  { id: 'tab-4', fileName: 'photo.png', filePath: '/assets/photo.png', isDirty: false },
];

const meta = {
  title: 'Business/Editor/EditorTabBar',
  component: EditorTabBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    tabs: { description: '标签页列表', control: 'object' },
    activeTab: { description: '当前激活的标签 ID', control: 'text' },
  },
} satisfies Meta<typeof EditorTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { tabs: mockTabs as unknown as EditorTab[], activeTab: 'tab-1' },
};

export const WithDirtyTab: Story = {
  args: { tabs: mockTabs as unknown as EditorTab[], activeTab: 'tab-2' },
};

export const SingleTab: Story = {
  args: { tabs: [mockTabs[0]] as unknown as EditorTab[], activeTab: 'tab-1' },
};
