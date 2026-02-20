import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorContainer from './EditorContainer.vue';
import type { EditorTab } from './EditorTabBar.vue';

const meta = {
  title: 'Business/Editor/EditorContainer',
  component: EditorContainer,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof EditorContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTabs: EditorTab[] = [
  {
    id: 'tab-1',
    title: 'README.md',
    fileType: 'markdown',
    filePath: '/docs/README.md',
    content: '# Hello World\n\nThis is a sample document.',
    isDirty: false,
  },
  {
    id: 'tab-2',
    title: 'Notes.md',
    fileType: 'markdown',
    filePath: '/docs/Notes.md',
    content: '## Meeting Notes\n\n- Item 1\n- Item 2',
    isDirty: true,
  },
];

export const Default: Story = {
  args: {
    initialTabs: mockTabs,
  },
};

export const SingleTab: Story = {
  args: {
    initialTabs: [mockTabs[0]],
  },
};

export const NoTabs: Story = {
  args: {
    initialTabs: [],
  },
};

export const WithDirtyTab: Story = {
  args: {
    initialTabs: [
      mockTabs[0],
      {
        id: 'tab-3',
        title: 'Unsaved.md',
        fileType: 'markdown',
        filePath: '/docs/Unsaved.md',
        content: '# Unsaved changes here',
        isDirty: true,
      },
    ],
  },
};
