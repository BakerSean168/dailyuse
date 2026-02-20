import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TabManager from './TabManager.vue';

const meta = {
  title: 'Business/Repository/TabManager',
  component: TabManager,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    tabs: { description: '标签页列表' },
    activeTabId: { description: '当前活跃标签 ID', control: 'text' },
  },
} satisfies Meta<typeof TabManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tabs: [
      { id: 'tab-1', name: 'README.md', icon: null, isDirty: false, isPinned: true },
      { id: 'tab-2', name: 'architecture.md', icon: null, isDirty: true, isPinned: false },
      { id: 'tab-3', name: 'api-reference.md', icon: null, isDirty: false, isPinned: false },
    ],
    activeTabId: 'tab-2',
  },
};

export const SingleTab: Story = {
  args: {
    tabs: [
      { id: 'tab-1', name: 'notes.md', icon: null, isDirty: false, isPinned: false },
    ],
    activeTabId: 'tab-1',
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: [
      { id: 'tab-1', name: 'index.md', icon: null, isDirty: false, isPinned: true },
      { id: 'tab-2', name: 'guide.md', icon: null, isDirty: false, isPinned: true },
      { id: 'tab-3', name: 'components.md', icon: null, isDirty: true, isPinned: false },
      { id: 'tab-4', name: 'hooks.md', icon: null, isDirty: false, isPinned: false },
      { id: 'tab-5', name: 'utils.md', icon: null, isDirty: true, isPinned: false },
      { id: 'tab-6', name: 'types.md', icon: null, isDirty: false, isPinned: false },
    ],
    activeTabId: 'tab-3',
  },
};

export const NoTabs: Story = {
  args: {
    tabs: [],
    activeTabId: null,
  },
};
