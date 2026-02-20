import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScheduleStatusCard from './ScheduleStatusCard.vue';

const meta = {
  title: 'Business/Reminder/ScheduleStatusCard',
  component: ScheduleStatusCard,
  tags: ['autodocs'],
  argTypes: {
    scheduleStatus: { control: 'object' },
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
  decorators: [() => ({ template: '<div class="max-w-lg p-4"><story /></div>' })],
} satisfies Meta<typeof ScheduleStatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

export const ActiveSchedule: Story = {
  args: {
    scheduleStatus: {
      enabled: true,
      hasSchedule: true,
      cronExpression: '0 */2 * * *',
      cronDescription: 'Every 2 hours',
      triggerType: 'INTERVAL',
      nextRunAt: now + 1000 * 60 * 45,
      lastRunAt: now - 1000 * 60 * 75,
      executionCount: 128,
      status: 'ACTIVE',
      recentExecutions: [
        { executedAt: now - 1000 * 60 * 75, success: true },
        { executedAt: now - 1000 * 60 * 195, success: true },
        { executedAt: now - 1000 * 60 * 315, success: false, error: 'Notification service timeout' },
      ],
    },
    isLoading: false,
  },
};

export const PausedSchedule: Story = {
  args: {
    scheduleStatus: {
      enabled: false,
      hasSchedule: true,
      cronExpression: '0 9 * * 1-5',
      cronDescription: 'Every weekday at 9:00 AM',
      triggerType: 'FIXED_TIME',
      nextRunAt: null,
      lastRunAt: now - 1000 * 60 * 60 * 48,
      executionCount: 42,
      status: 'PAUSED',
      recentExecutions: [],
    },
    isLoading: false,
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
  },
};

export const Loading: Story = {
  args: {
    scheduleStatus: null,
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    scheduleStatus: null,
    isLoading: false,
    error: 'Unable to fetch schedule status. The server returned a 503 error.',
  },
};
