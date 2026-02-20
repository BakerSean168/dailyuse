import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ContextMenu from './ContextMenu.vue';

const meta = {
  title: 'Business/Reminder/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    show: { description: '是否显示', control: 'boolean' },
    x: { description: 'X 坐标', control: 'number' },
    y: { description: 'Y 坐标', control: 'number' },
    items: { description: '菜单项列表' },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    show: true,
    x: 200,
    y: 150,
    items: [
      { label: '编辑', icon: 'mdi-pencil' },
      { label: '查看', icon: 'mdi-eye' },
      { divider: true },
      { label: '移动到分组', icon: 'mdi-folder-move' },
      { label: '暂停', icon: 'mdi-pause' },
      { divider: true },
      { label: '删除', icon: 'mdi-delete', danger: true },
    ],
  },
};

export const WithShortcuts: Story = {
  args: {
    show: true,
    x: 200,
    y: 150,
    items: [
      { label: '编辑', icon: 'mdi-pencil', shortcut: 'Ctrl+E' },
      { label: '删除', icon: 'mdi-delete', shortcut: 'Del', danger: true },
    ],
  },
};

export const WithDisabled: Story = {
  args: {
    show: true,
    x: 200,
    y: 150,
    items: [
      { label: '编辑', icon: 'mdi-pencil' },
      { label: '移动到分组', icon: 'mdi-folder-move', disabled: true },
      { label: '删除', icon: 'mdi-delete', danger: true, disabled: true },
    ],
  },
};

export const Hidden: Story = {
  args: {
    show: false,
    x: 0,
    y: 0,
    items: [],
  },
};
