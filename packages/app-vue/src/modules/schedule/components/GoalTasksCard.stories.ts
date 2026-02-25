import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalTasksCard from './GoalTasksCard.vue';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';

function makeTask(
  overrides: Partial<ScheduleTaskClientDTO> & { id: string; name: string },
): ScheduleTaskClientDTO {
  const now = new Date();
  return {
    identityId: 'user-1',
    description: null,
    sourceModule: 'Goal',
    sourceEntityId: 'goal-1',
    status: 'Active',
    enabled: true,
    schedule: {
      cronExpression: '0 9 * * 1-5',
      timezone: 'Asia/Shanghai',
      startDate: null,
      endDate: null,
      maxExecutions: null,
      cronDescription: 'At 09:00, Monday through Friday',
      timezoneDisplay: 'Asia/Shanghai',
      startDateFormatted: null,
      endDateFormatted: null,
      maxExecutionsFormatted: 'Unlimited',
    },
    execution: {
      nextRunAt: new Date(now.getTime() + 86400000).toISOString(),
      lastRunAt: new Date(now.getTime() - 3600000).toISOString(),
      executionCount: 12,
      lastExecutionStatus: 'Success',
      consecutiveFailures: 0,
      nextRunAtFormatted: 'Tomorrow 09:00',
      lastRunAtFormatted: '1 hour ago',
      lastExecutionDurationFormatted: '2.3s',
      executionCountFormatted: '12 times',
      healthStatus: 'healthy',
    },
    retryPolicy: {
      enabled: true,
      maxRetries: 3,
      retryDelay: 60,
      backoffMultiplier: 2,
      maxRetryDelay: 3600,
      policyDescription: 'Retry 3 times with exponential backoff',
      enabledDisplay: 'Enabled',
      retryDelayFormatted: '1 min',
      maxRetryDelayFormatted: '1 hour',
    },
    metadata: {
      payload: {},
      tags: ['goal'],
      priority: 'Normal',
      timeout: null,
      priorityDisplay: 'Normal',
      priorityColor: 'blue',
      tagsDisplay: 'goal',
      timeoutFormatted: 'No timeout',
      payloadSummary: '',
    },
    version: 1,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
    deletedAt: null,
    statusDisplay: 'Active',
    statusColor: 'green',
    sourceModuleDisplay: 'Goal Module',
    enabledDisplay: 'Enabled',
    nextRunAtFormatted: 'Tomorrow 09:00',
    lastRunAtFormatted: '1 hour ago',
    executionSummary: '12 executions, 12 successful',
    healthStatus: 'healthy',
    isOverdue: false,
    executions: null,
    ...overrides,
  } as ScheduleTaskClientDTO;
}

const mockTasks: ScheduleTaskClientDTO[] = [
  makeTask({ id: 'task-1', name: 'Review quarterly goals' }),
  makeTask({
    id: 'task-2',
    name: 'Update OKR progress',
    status: 'Paused',
    statusDisplay: 'Paused',
    statusColor: 'gray',
    enabled: false,
    enabledDisplay: 'Disabled',
  }),
  makeTask({
    id: 'task-3',
    name: 'Send goal summary report',
    execution: {
      nextRunAt: null,
      lastRunAt: new Date(Date.now() - 7200000).toISOString(),
      executionCount: 5,
      lastExecutionStatus: 'Failed',
      consecutiveFailures: 3,
      nextRunAtFormatted: '-',
      lastRunAtFormatted: '2 hours ago',
      lastExecutionDurationFormatted: '0.5s',
      executionCountFormatted: '5 times',
      healthStatus: 'critical',
    },
    healthStatus: 'critical',
  }),
];

const meta = {
  title: 'Business/Schedule/GoalTasksCard',
  component: GoalTasksCard,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    tasks: mockTasks,
    isLoading: false,
  },
} satisfies Meta<typeof GoalTasksCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tasks: mockTasks,
  },
};

export const Loading: Story = {
  args: {
    tasks: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    tasks: [],
  },
};

export const WithError: Story = {
  args: {
    tasks: [],
    error: 'Failed to load goal tasks. Please try again.',
  },
};
