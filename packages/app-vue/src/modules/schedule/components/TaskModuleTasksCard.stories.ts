import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskModuleTasksCard from './TaskModuleTasksCard.vue';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';

function makeTaskModuleTask(
  overrides: Record<string, unknown> & { id: string; name: string },
): ScheduleTaskClientDTO {
  const now = new Date();
  return {
    identityId: 'user-1',
    description: null,
    sourceModule: 'Task',
    sourceEntityId: 'task-entity-1',
    status: 'Active',
    enabled: true,
    schedule: {
      cronExpression: '0 10 * * *',
      timezone: 'Asia/Shanghai',
      startDate: null,
      endDate: null,
      maxExecutions: null,
      cronDescription: 'Every day at 10:00',
      timezoneDisplay: 'Asia/Shanghai',
      startDateFormatted: null,
      endDateFormatted: null,
      maxExecutionsFormatted: 'Unlimited',
    },
    execution: {
      nextRunAt: new Date(now.getTime() + 43200000).toISOString(),
      lastRunAt: new Date(now.getTime() - 7200000).toISOString(),
      executionCount: 20,
      lastExecutionStatus: 'Success',
      consecutiveFailures: 0,
      nextRunAtFormatted: 'Today 10:00',
      lastRunAtFormatted: '2 hours ago',
      lastExecutionDurationFormatted: '1.5s',
      executionCountFormatted: '20 times',
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
      tags: ['task'],
      priority: 'Normal',
      timeout: null,
      priorityDisplay: 'Normal',
      priorityColor: 'blue',
      tagsDisplay: 'task',
      timeoutFormatted: 'No timeout',
      payloadSummary: '',
    },
    version: 1,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
    deletedAt: null,
    statusDisplay: 'Active',
    statusColor: 'green',
    sourceModuleDisplay: 'Task Module',
    enabledDisplay: 'Enabled',
    nextRunAtFormatted: 'Today 10:00',
    lastRunAtFormatted: '2 hours ago',
    executionSummary: '20 executions, 20 successful',
    healthStatus: 'healthy',
    isOverdue: false,
    executions: null,
    ...overrides,
  } as ScheduleTaskClientDTO;
}

const mockTasks: ScheduleTaskClientDTO[] = [
  makeTaskModuleTask({ id: 'tm-1', name: 'Auto-assign overdue tasks' }),
  makeTaskModuleTask({
    id: 'tm-2',
    name: 'Send task deadline reminders',
    description: 'Notify assignees 24h before deadline',
  }),
  makeTaskModuleTask({
    id: 'tm-3',
    name: 'Archive completed tasks',
    status: 'Paused',
    statusDisplay: 'Paused',
    statusColor: 'gray',
    enabled: false,
    enabledDisplay: 'Disabled',
  }),
  makeTaskModuleTask({
    id: 'tm-4',
    name: 'Generate task analytics report',
    execution: {
      nextRunAt: null,
      lastRunAt: new Date(Date.now() - 86400000).toISOString(),
      executionCount: 8,
      lastExecutionStatus: 'Failed',
      consecutiveFailures: 2,
      nextRunAtFormatted: '-',
      lastRunAtFormatted: 'Yesterday',
      lastExecutionDurationFormatted: '0.3s',
      executionCountFormatted: '8 times',
      healthStatus: 'warning',
    },
    healthStatus: 'warning',
  }),
];

const meta = {
  title: 'Business/Schedule/TaskModuleTasksCard',
  component: TaskModuleTasksCard,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    tasks: mockTasks,
    isLoading: false,
  },
} satisfies Meta<typeof TaskModuleTasksCard>;

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
    error: 'Could not load task module tasks.',
  },
};
