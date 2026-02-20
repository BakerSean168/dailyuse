import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReminderInstanceSidebar from './ReminderInstanceSidebar.vue';

const now = Date.now();
const hourFromNow = now + 3600_000;
const twoHoursFromNow = now + 7200_000;
const tomorrow = now + 86400_000;
const hourAgo = now - 3600_000;

const meta = {
  title: 'Business/Reminder/ReminderInstanceSidebar',
  component: ReminderInstanceSidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    visible: { description: '是否显示侧边栏', control: 'boolean' },
    title: { description: '标题', control: 'text' },
    isLoading: { description: '加载状态', control: 'boolean' },
    error: { description: '错误信息', control: 'text' },
  },
} satisfies Meta<typeof ReminderInstanceSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visible: true,
    title: 'Upcoming Reminders',
    isLoading: false,
    error: null,
    stats: { total: 12, today: 5, overdue: 1 },
    groupedReminders: [
      {
        date: new Date().toISOString().split('T')[0],
        dateLabel: '今天',
        reminders: [
          { id: '1', title: '喝水', message: '记得喝一杯水 💧', priority: 'normal', nextTriggerAt: hourFromNow, tags: ['健康'], isOverdue: false, timeLabel: '1 小时后' },
          { id: '2', title: '站立会议', message: '每日站会 - Zoom', priority: 'high', nextTriggerAt: twoHoursFromNow, tags: ['工作', '会议'], isOverdue: false, timeLabel: '2 小时后' },
          { id: '3', title: '吃药', message: '饭后服药', priority: 'urgent', nextTriggerAt: hourAgo, tags: ['健康'], isOverdue: true, timeLabel: '1 小时前（已过期）' },
        ],
      },
      {
        date: new Date(tomorrow).toISOString().split('T')[0],
        dateLabel: '明天',
        reminders: [
          { id: '4', title: '周报', message: '提交本周工作总结', priority: 'high', nextTriggerAt: tomorrow, tags: ['工作'], isOverdue: false, timeLabel: '09:00' },
          { id: '5', title: '运动', message: '去健身房', priority: 'low', nextTriggerAt: tomorrow + 3600_000 * 8, tags: ['健康'], isOverdue: false, timeLabel: '18:00' },
        ],
      },
    ],
    filters: { days: '3' },
  },
};

export const Loading: Story = {
  args: {
    visible: true,
    title: 'Upcoming Reminders',
    isLoading: true,
    error: null,
    stats: null,
    groupedReminders: [],
  },
};

export const Error: Story = {
  args: {
    visible: true,
    title: 'Upcoming Reminders',
    isLoading: false,
    error: '无法加载提醒数据，请检查网络连接。',
    stats: null,
    groupedReminders: [],
  },
};

export const Empty: Story = {
  args: {
    visible: true,
    title: 'Upcoming Reminders',
    isLoading: false,
    error: null,
    stats: { total: 0, today: 0, overdue: 0 },
    groupedReminders: [],
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    title: 'Upcoming Reminders',
    isLoading: false,
    error: null,
    groupedReminders: [],
  },
};
