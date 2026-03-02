import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReminderTasksCard from './ReminderTasksCard.vue';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';

function makeReminderTask(
  overrides: Record<string, unknown> & { id: string; name: string },
): ScheduleTaskClientDTO {
  const now = new Date();
  return {
    identityId: 'user-1',
    description: null,
    sourceModule: 'Reminder',
    sourceEntityId: 'reminder-1',
    status: 'Active',
    enabled: true,
    schedule: {
      cronExpression: '0 8 * * *',
      timezone: 'Asia/Shanghai',
      startDate: null,
      endDate: null,
      maxExecutions: null,
      cronDescription: 'Every day at 08:00',
      timezoneDisplay: 'Asia/Shanghai',
      startDateFormatted: null,
      endDateFormatted: null,
      maxExecutionsFormatted: 'Unlimited',
    },
    execution: {
      nextRunAt: new Date(now.getTime() + 43200000).toISOString(),
      lastRunAt: new Date(now.getTime() - 1800000).toISOString(),
      executionCount: 30,
      lastExecutionStatus: 'Success',
      consecutiveFailures: 0,
      nextRunAtFormatted: 'Tomorrow 08:00',
      lastRunAtFormatted: '30 min ago',
      lastExecutionDurationFormatted: '0.8s',
      executionCountFormatted: '30 times',
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
      tags: ['reminder'],
      priority: 'Normal',
      timeout: null,
      priorityDisplay: 'Normal',
      priorityColor: 'blue',
      tagsDisplay: 'reminder',
      timeoutFormatted: 'No timeout',
      payloadSummary: '',
    },
    version: 1,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
    deletedAt: null,
    statusDisplay: 'Active',
    statusColor: 'green',
    sourceModuleDisplay: 'Reminder Module',
    enabledDisplay: 'Enabled',
    nextRunAtFormatted: 'Tomorrow 08:00',
    lastRunAtFormatted: '30 min ago',
    executionSummary: '30 executions, 30 successful',
    healthStatus: 'healthy',
    isOverdue: false,
    executions: null,
    ...overrides,
  } as ScheduleTaskClientDTO;
}

const mockTasks: ScheduleTaskClientDTO[] = [
  makeReminderTask({ id: 'rem-1', name: 'Morning standup reminder' }),
  makeReminderTask({
    id: 'rem-2',
    name: 'Take medication',
    description: 'Daily vitamin D supplement',
  }),
  makeReminderTask({
    id: 'rem-3',
    name: 'Weekly report deadline',
    status: 'Paused',
    statusDisplay: 'Paused',
    statusColor: 'gray',
    enabled: false,
    enabledDisplay: 'Disabled',
    schedule: {
      cronExpression: '0 17 * * 5',
      timezone: 'Asia/Shanghai',
      startDate: null,
      endDate: null,
      maxExecutions: null,
      cronDescription: 'Every Friday at 17:00',
      timezoneDisplay: 'Asia/Shanghai',
      startDateFormatted: null,
      endDateFormatted: null,
      maxExecutionsFormatted: 'Unlimited',
    },
  }),
];

const meta = {
  title: 'Business/Schedule/ReminderTasksCard',
  component: ReminderTasksCard,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    tasks: mockTasks,
    isLoading: false,
  },
} satisfies Meta<typeof ReminderTasksCard>;

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
    error: 'Unable to fetch reminder tasks.',
  },
};
