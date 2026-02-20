import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GroupDesktopCard from './GroupDesktopCard.vue';

const meta = {
  title: 'Business/Reminder/GroupDesktopCard',
  component: GroupDesktopCard,
  tags: ['autodocs'],
  argTypes: {
    group: { control: 'object' },
    templateCount: { control: 'number' },
  },
  decorators: [() => ({ template: '<div class="w-64 p-4"><story /></div>' })],
} satisfies Meta<typeof GroupDesktopCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    group: {
      id: 'grp-1',
      name: 'Work Reminders',
      description: 'All work-related reminder templates',
      icon: 'mdi-briefcase',
      color: '#2196F3',
      enabled: true,
      controlMode: 'Individual',
    },
    templateCount: 5,
  },
};

export const GroupControlMode: Story = {
  args: {
    group: {
      id: 'grp-2',
      name: 'Health & Fitness',
      description: 'Exercise and hydration reminders',
      icon: 'mdi-heart',
      color: '#4CAF50',
      enabled: true,
      controlMode: 'Group',
    },
    templateCount: 3,
  },
};

export const Disabled: Story = {
  args: {
    group: {
      id: 'grp-3',
      name: 'Archived Plans',
      description: null,
      icon: 'mdi-folder',
      color: '#9E9E9E',
      enabled: false,
      controlMode: 'Individual',
    },
    templateCount: 0,
  },
};

export const NoDescription: Story = {
  args: {
    group: {
      id: 'grp-4',
      name: 'Personal',
      description: null,
      icon: 'mdi-home',
      color: '#FF9800',
      enabled: true,
      controlMode: 'Individual',
    },
    templateCount: 12,
  },
};
