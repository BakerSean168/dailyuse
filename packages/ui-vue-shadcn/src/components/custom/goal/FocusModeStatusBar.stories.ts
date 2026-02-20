import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FocusModeStatusBar from './FocusModeStatusBar.vue';

const meta = {
  title: 'Business/Goal/FocusModeStatusBar',
  component: FocusModeStatusBar,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select', options: ['active', 'expired'] },
    show: { control: 'boolean' },
    loading: { control: 'boolean' },
    remainingDays: { control: { type: 'number', min: 0, max: 90 } },
  },
  args: {
    show: true,
    status: 'active',
    statusText: '专注模式已启用',
    detailText: '当前专注：提升团队交付效率、优化系统性能',
    remainingDays: 14,
    loading: false,
  },
} satisfies Meta<typeof FocusModeStatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {},
};

export const Expired: Story = {
  args: {
    status: 'expired',
    statusText: '专注模式已过期',
    detailText: '请延期或关闭当前专注周期',
    remainingDays: 0,
  },
};

export const WarningFewDays: Story = {
  args: {
    statusText: '专注模式即将到期',
    detailText: '专注周期将在 3 天内结束',
    remainingDays: 3,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Hidden: Story = {
  args: {
    show: false,
  },
};
