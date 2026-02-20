import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScheduleStatusCard from './ScheduleStatusCard.vue';

const now = new Date();
const nextRun = new Date(now.getTime() + 3600_000 * 2);
const lastRun = new Date(now.getTime() - 3600_000 * 4);

const meta = {
  title: 'Business/Reminder/ScheduleStatusCard',
  component: ScheduleStatusCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    () => ({ template: '<div style="max-width: 500px;"><story /></div>' }),
  ],
  argTypes: {
    isLoading: { description: '加载状态', control: 'boolean' },
    error: { description: '错误信息', control: 'text' },
  },
} satisfies Meta<typeof ScheduleStatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    scheduleStatus: {
      enabled: true,
      hasSchedule: true,
      cronExpression: '0 */2 * * *',
      cronDescription: '每 2 小时执行一次',
      triggerType: 'INTERVAL',
      nextRunAt: nextRun.toISOString(),
      lastRunAt: lastRun.toISOString(),
      executionCount: 142,
      status: 'ACTIVE',
      recentExecutions: [
        { executedAt: lastRun.toISOString(), success: true },
        { executedAt: new Date(lastRun.getTime() - 7200_000).toISOString(), success: true },
        { executedAt: new Date(lastRun.getTime() - 14400_000).toISOString(), success: false, error: 'Network timeout' },
      ],
    },
    isLoading: false,
    error: null,
  },
};

export const Paused: Story = {
  args: {
    scheduleStatus: {
      enabled: false,
      hasSchedule: true,
      cronExpression: '0 9 * * 1-5',
      cronDescription: '每周一至周五 9:00',
      triggerType: 'FIXED_TIME',
      scheduledTime: '09:00',
      lastRunAt: lastRun.toISOString(),
      executionCount: 56,
      status: 'PAUSED',
    },
    isLoading: false,
    error: null,
  },
};

export const NoSchedule: Story = {
  args: {
    scheduleStatus: {
      enabled: false,
      hasSchedule: false,
      executionCount: 0,
    },
    isLoading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    scheduleStatus: null,
    isLoading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    scheduleStatus: null,
    isLoading: false,
    error: '无法加载调度状态信息。',
  },
};
