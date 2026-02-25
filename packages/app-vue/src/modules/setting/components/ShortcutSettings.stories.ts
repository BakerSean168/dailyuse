import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Globe, FileEdit, CheckSquare, Target } from 'lucide-vue-next';
import ShortcutSettings from './ShortcutSettings.vue';

const mockCategories = [
  {
    name: 'global',
    label: 'Global',
    iconComponent: Globe,
    shortcuts: [
      { id: 'sc-1', label: 'Search', description: 'Open global search', key: 'Ctrl+K', defaultKey: 'Ctrl+K' },
      { id: 'sc-2', label: 'Settings', description: 'Open settings panel', key: 'Ctrl+,', defaultKey: 'Ctrl+,' },
      { id: 'sc-3', label: 'Command Palette', description: 'Show command palette', key: 'Ctrl+Shift+P', defaultKey: 'Ctrl+Shift+P' },
    ],
  },
  {
    name: 'editor',
    label: 'Editor',
    iconComponent: FileEdit,
    shortcuts: [
      { id: 'sc-4', label: 'Save', description: 'Save current document', key: 'Ctrl+S', defaultKey: 'Ctrl+S' },
      { id: 'sc-5', label: 'Bold', description: 'Toggle bold text', key: 'Ctrl+B', defaultKey: 'Ctrl+B' },
      { id: 'sc-6', label: 'Italic', description: 'Toggle italic text', key: 'Ctrl+I', defaultKey: 'Ctrl+I' },
    ],
  },
  {
    name: 'task',
    label: 'Tasks',
    iconComponent: CheckSquare,
    shortcuts: [
      { id: 'sc-7', label: 'New Task', description: 'Create a new task', key: 'Ctrl+N', defaultKey: 'Ctrl+N' },
      { id: 'sc-8', label: 'Complete Task', description: 'Mark task as done', key: 'Ctrl+D', defaultKey: 'Ctrl+D' },
    ],
  },
  {
    name: 'goal',
    label: 'Goals',
    iconComponent: Target,
    shortcuts: [
      { id: 'sc-9', label: 'New Goal', description: 'Create a new goal', key: 'Ctrl+G', defaultKey: 'Ctrl+G' },
    ],
  },
];

const meta = {
  title: 'Business/Setting/ShortcutSettings',
  component: ShortcutSettings,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    categories: mockCategories,
  },
} satisfies Meta<typeof ShortcutSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    categories: mockCategories,
  },
};

export const WithEditingShortcut: Story = {
  args: {
    categories: mockCategories,
    editingShortcut: mockCategories[0].shortcuts[0],
    editingKey: 'Ctrl+K',
  },
};

export const CustomizedShortcuts: Story = {
  args: {
    categories: [
      {
        ...mockCategories[0],
        shortcuts: [
          { id: 'sc-1', label: 'Search', description: 'Open global search', key: 'Ctrl+F', defaultKey: 'Ctrl+K' },
          { id: 'sc-2', label: 'Settings', description: 'Open settings panel', key: 'Alt+S', defaultKey: 'Ctrl+,' },
          mockCategories[0].shortcuts[2],
        ],
      },
      ...mockCategories.slice(1),
    ],
  },
};
