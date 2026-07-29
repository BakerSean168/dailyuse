import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StatisticsCard from './StatisticsCard.vue';
import type { SourceModule } from '@memoflow/contracts/schedule';

const mockStatistics = {
  totalTasks: 24,
  activeTasks: 18,
  pausedTasks: 3,
  completedTasks: 2,
  failedTasks: 1,
  successRate: 94.5,
  totalExecutions: 1280,
  successfulExecutions: 1210,
  failedExecutions: 70,
};

const mockModuleStatistics = {
  Reminder: { totalTasks: 8, activeTasks: 7, totalExecutions: 560, successRate: 97.1, successRateFormatted: '97.1%' },
  Task: { totalTasks: 6, activeTasks: 5, totalExecutions: 320, successRate: 93.4, successRateFormatted: '93.4%' },
  Goal: { totalTasks: 5, activeTasks: 4, totalExecutions: 240, successRate: 91.2, successRateFormatted: '91.2%' },
  Notification: { totalTasks: 3, activeTasks: 2, totalExecutions: 100, successRate: 96.0, successRateFormatted: '96.0%' },
  System: { totalTasks: 1, activeTasks: 0, totalExecutions: 40, successRate: 100.0, successRateFormatted: '100.0%' },
  Custom: { totalTasks: 1, activeTasks: 0, totalExecutions: 20, successRate: 85.0, successRateFormatted: '85.0%' },
} as unknown as Record<SourceModule, { totalTasks: number; activeTasks: number; totalExecutions: number; successRate: number; successRateFormatted: string }>;

const meta = {
  title: 'Business/Schedule/StatisticsCard',
  component: StatisticsCard,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    statistics: mockStatistics,
    isLoading: false,
  },
} satisfies Meta<typeof StatisticsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    statistics: mockStatistics,
  },
};

export const WithModuleStatistics: Story = {
  args: {
    statistics: mockStatistics,
    moduleStatistics: mockModuleStatistics,
  },
};

export const Loading: Story = {
  args: {
    statistics: null,
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    statistics: null,
    error: 'Failed to load statistics data.',
  },
};
