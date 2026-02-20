import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GroupDesktopCard from './GroupDesktopCard.vue';

const meta = {
  title: 'Business/Reminder/GroupDesktopCard',
  component: GroupDesktopCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    () => ({ template: '<div style="width: 280px; height: 300px;"><story /></div>' }),
  ],
  argTypes: {
    group: { description: '分组数据对象' },
    templateCount: { description: '模板数量', control: 'number' },
  },
} satisfies Meta<typeof GroupDesktopCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {
  args: {
    group: {
      id: 'grp-1',
      name: '工作提醒',
      description: '工作相关的所有提醒模板',
      icon: 'mdi-briefcase',
      color: '#2196F3',
      enabled: true,
      controlMode: 'Individual',
    },
    templateCount: 5,
  },
};

export const GroupControl: Story = {
  args: {
    group: {
      id: 'grp-2',
      name: '健康管理',
      description: '日常健康习惯追踪',
      icon: 'mdi-heart',
      color: '#4CAF50',
      enabled: true,
      controlMode: 'Group',
    },
    templateCount: 8,
  },
};

export const Disabled: Story = {
  args: {
    group: {
      id: 'grp-3',
      name: '学习计划',
      description: '已暂停的学习提醒',
      icon: 'mdi-school',
      color: '#9C27B0',
      enabled: false,
      controlMode: 'Individual',
    },
    templateCount: 3,
  },
};

export const NoDescription: Story = {
  args: {
    group: {
      id: 'grp-4',
      name: '娱乐',
      description: null,
      icon: 'mdi-gamepad',
      color: '#FF9800',
      enabled: true,
      controlMode: 'Individual',
    },
    templateCount: 0,
  },
};
