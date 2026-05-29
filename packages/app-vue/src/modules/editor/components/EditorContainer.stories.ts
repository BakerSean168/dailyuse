import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorContainer from './EditorContainer.vue';
import type { EditorTab } from '../types';

const mockTabs = [
  {
    id: 'tab-1',
    filePath: '/notes/welcome.md',
    fileName: 'welcome.md',
    content: '# Welcome\n\nThis is a test note.',
    isDirty: false,
    language: 'markdown',
  },
  {
    id: 'tab-2',
    filePath: '/notes/todo.md',
    fileName: 'todo.md',
    content: '# TODO\n\n- [ ] First task\n- [x] Done task',
    isDirty: true,
    language: 'markdown',
  },
];

const meta = {
  title: 'Business/Editor/EditorContainer',
  component: EditorContainer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [() => ({ template: '<div style="height: 600px;"><story /></div>' })],
  argTypes: {
    initialTabs: { description: '初始标签页列表', control: 'object' },
  },
} satisfies Meta<typeof EditorContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTabs: Story = {
  args: { initialTabs: mockTabs as unknown as EditorTab[] },
};

export const Empty: Story = {
  args: { initialTabs: [] },
};
