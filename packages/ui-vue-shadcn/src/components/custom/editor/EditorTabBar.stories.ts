import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorTabBar from './EditorTabBar.vue';
import type { EditorTab } from './EditorTabBar.vue';

const meta = {
  title: 'Business/Editor/EditorTabBar',
  component: EditorTabBar,
  tags: ['autodocs'],
  argTypes: {
    activeTab: { control: 'text' },
  },
} satisfies Meta<typeof EditorTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTabs: EditorTab[] = [
  {
    id: 'tab-1',
    title: 'README.md',
    fileType: 'markdown',
    filePath: '/docs/README.md',
    isDirty: false,
  },
  {
    id: 'tab-2',
    title: 'Notes.md',
    fileType: 'markdown',
    filePath: '/docs/Notes.md',
    isDirty: true,
  },
  {
    id: 'tab-3',
    title: 'photo.jpg',
    fileType: 'image',
    filePath: '/media/photo.jpg',
    isDirty: false,
  },
];

export const Default: Story = {
  args: {
    tabs: mockTabs,
    activeTab: 'tab-1',
  },
};

export const SingleTab: Story = {
  args: {
    tabs: [mockTabs[0]],
    activeTab: 'tab-1',
  },
};

export const WithDirtyIndicator: Story = {
  args: {
    tabs: [
      { ...mockTabs[0], isDirty: true },
      { ...mockTabs[1], isDirty: true },
    ],
    activeTab: 'tab-1',
  },
};

export const MixedFileTypes: Story = {
  args: {
    tabs: [
      ...mockTabs,
      {
        id: 'tab-4',
        title: 'clip.mp4',
        fileType: 'video' as const,
        filePath: '/media/clip.mp4',
        isDirty: false,
      },
      {
        id: 'tab-5',
        title: 'song.mp3',
        fileType: 'audio' as const,
        filePath: '/media/song.mp3',
        isDirty: false,
      },
    ],
    activeTab: 'tab-3',
  },
};

export const WithPinnedTab: Story = {
  args: {
    tabs: [
      { ...mockTabs[0], isPinned: true },
      mockTabs[1],
      mockTabs[2],
    ],
    activeTab: 'tab-1',
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: Array.from({ length: 8 }, (_, i) => ({
      id: `tab-${i}`,
      title: `Document-${i + 1}.md`,
      fileType: 'markdown' as const,
      filePath: `/docs/Document-${i + 1}.md`,
      isDirty: i % 3 === 0,
    })),
    activeTab: 'tab-0',
  },
};
