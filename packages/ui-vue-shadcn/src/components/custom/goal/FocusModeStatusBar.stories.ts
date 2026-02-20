import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FocusModeStatusBar from './FocusModeStatusBar.vue';

const meta = {
  title: 'Business/Goal/FocusModeStatusBar',
  component: FocusModeStatusBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    show: { description: '是否显示', control: 'boolean' },
    status: { description: '状态', control: 'select', options: ['active', 'expired'] },
    statusText: { description: '状态文本', control: 'text' },
    detailText: { description: '详情文本', control: 'text' },
    remainingDays: { description: '剩余天数', control: 'number' },
    loading: { description: '加载中', control: 'boolean' },
  },
} satisfies Meta<typeof FocusModeStatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    show: true,
    status: 'active',
    statusText: '专注模式已启用',
    detailText: '正在专注「提升编程能力」',
    remainingDays: 14,
    loading: false,
  },
};

export const Expired: Story = {
  args: {
    show: true,
    status: 'expired',
    statusText: '专注周期已过期',
    detailText: '「提升编程能力」专注周期已结束',
    remainingDays: 0,
    loading: false,
  },
};

export const UrgentDeadline: Story = {
  args: {
    show: true,
    status: 'active',
    statusText: '专注模式即将到期',
    detailText: '请尽快完成当前目标',
    remainingDays: 2,
    loading: false,
  },
};

export const Hidden: Story = {
  args: {
    show: false,
    status: 'active',
    statusText: '',
    detailText: '',
    remainingDays: 0,
  },
};
