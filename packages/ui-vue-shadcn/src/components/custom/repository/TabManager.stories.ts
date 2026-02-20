import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TabManager from './TabManager.vue';

const meta = {
  title: 'Business/Repository/TabManager',
  component: TabManager,
  tags: ['autodocs'],
  argTypes: {
    activeTabId: { control: 'text' },
  },
  args: {},
} satisfies Meta<typeof TabManager>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTabs = [
  { id: 'tab-1', name: 'README.md', icon: null, isDirty: false, isPinned: true },
  { id: 'tab-2', name: 'Architecture.md', icon: null, isDirty: true, isPinned: false },
  { id: 'tab-3', name: 'API Reference.md', icon: null, isDirty: false, isPinned: false },
  { id: 'tab-4', name: 'Meeting Notes.md', icon: null, isDirty: true, isPinned: false },
];

export const Default: Story = {
  args: {
    tabs: mockTabs,
    activeTabId: 'tab-2',
  },
};

export const SingleTab: Story = {
  args: {
    tabs: [mockTabs[0]],
    activeTabId: 'tab-1',
  },
};

export const AllPinned: Story = {
  args: {
    tabs: mockTabs.map((t) => ({ ...t, isPinned: true, isDirty: false })),
    activeTabId: 'tab-1',
  },
};

export const NoActiveTab: Story = {
  args: {
    tabs: mockTabs,
    activeTabId: null,
  },
};
