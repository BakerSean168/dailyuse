import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ContextMenu from './ContextMenu.vue';

const meta = {
  title: 'Business/Reminder/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
  argTypes: {
    show: { control: 'boolean' },
    x: { control: 'number' },
    y: { control: 'number' },
    items: { control: 'object' },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const basicItems = [
  { label: 'Edit Template', icon: 'Pencil' },
  { label: 'View Instances', icon: 'Eye' },
  { divider: true },
  { label: 'Delete', icon: 'Trash2', danger: true },
];

export const Default: Story = {
  args: {
    show: true,
    x: 100,
    y: 100,
    items: basicItems,
  },
};

export const WithShortcuts: Story = {
  args: {
    show: true,
    x: 100,
    y: 100,
    items: [
      { label: 'Edit', icon: 'Pencil', shortcut: '⌘E' },
      { label: 'Move to Group', icon: 'mdi-folder-move' },
      { divider: true },
      { label: 'Delete', icon: 'Trash2', danger: true, shortcut: '⌫' },
    ],
  },
};

export const WithDisabledItems: Story = {
  args: {
    show: true,
    x: 100,
    y: 100,
    items: [
      { label: 'Edit', icon: 'Pencil' },
      { label: 'Move', icon: 'mdi-folder-move', disabled: true },
      { divider: true },
      { label: 'Delete', icon: 'Trash2', danger: true, disabled: true },
    ],
  },
};

export const Hidden: Story = {
  args: {
    show: false,
    x: 0,
    y: 0,
    items: basicItems,
  },
};
