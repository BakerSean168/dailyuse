import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ScheduleTaskDetailDialog from './ScheduleTaskDetailDialog.vue';

const now = Date.now();

const mockTask = {
  id: 'task-1',
  name: 'Daily Goal Progress Check',
  description: 'Automatically checks and records goal completion progress every day',
  sourceModule: 'Goal',
  status: 'Active',
  enabled: true,
  execution: {
    executionCount: 45,
    nextRunAt: now + 86400000,
    lastRunAt: now - 3600000,
    lastExecutionStatus: 'Success',
    consecutiveFailures: 0,
  },
  schedule: {
    cronExpression: '0 9 * * 1-5',
    timezone: 'Asia/Shanghai',
    startDate: now - 30 * 86400000,
    endDate: undefined,
  },
};

const mockExecutions = [
  { id: 'exec-1', executionTime: now - 3600000, status: 'Success', duration: 2300 },
  { id: 'exec-2', executionTime: now - 90000000, status: 'Success', duration: 1800 },
  { id: 'exec-3', executionTime: now - 176400000, status: 'Failed', duration: 500, error: 'Connection timeout to goal service' },
  { id: 'exec-4', executionTime: now - 262800000, status: 'Success', duration: 2100 },
];

const failedTask = {
  id: 'task-2',
  name: 'Sync Reminder Notifications',
  description: 'Push reminder notifications to all registered devices',
  sourceModule: 'Reminder',
  status: 'Failed',
  enabled: true,
  execution: {
    executionCount: 12,
    nextRunAt: undefined,
    lastRunAt: now - 7200000,
    lastExecutionStatus: 'Failed',
    consecutiveFailures: 5,
  },
  schedule: {
    cronExpression: '*/30 * * * *',
    timezone: 'Asia/Shanghai',
  },
};

const meta = {
  title: 'Business/Schedule/ScheduleTaskDetailDialog',
  component: ScheduleTaskDetailDialog,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    loadingHistory: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    show: true,
    task: mockTask,
    executions: mockExecutions,
    loading: false,
    loadingHistory: false,
  },
} satisfies Meta<typeof ScheduleTaskDetailDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { ScheduleTaskDetailDialog },
    setup() {
      const show = ref(args.show);
      return { args, show };
    },
    template: '<ScheduleTaskDetailDialog v-bind="args" v-model:show="show" />',
  }),
  args: {
    show: true,
    task: mockTask,
    executions: mockExecutions,
  },
};

export const FailedTask: Story = {
  render: (args: any) => ({
    components: { ScheduleTaskDetailDialog },
    setup() {
      const show = ref(true);
      return { args, show };
    },
    template: '<ScheduleTaskDetailDialog v-bind="args" v-model:show="show" />',
  }),
  args: {
    show: true,
    task: failedTask,
    executions: [
      { id: 'exec-f1', executionTime: now - 7200000, status: 'Failed', duration: 350, error: 'Push service unavailable' },
      { id: 'exec-f2', executionTime: now - 9000000, status: 'Failed', duration: 400, error: 'Push service unavailable' },
    ],
  },
};

export const Loading: Story = {
  render: (args: any) => ({
    components: { ScheduleTaskDetailDialog },
    setup() {
      const show = ref(true);
      return { args, show };
    },
    template: '<ScheduleTaskDetailDialog v-bind="args" v-model:show="show" />',
  }),
  args: {
    show: true,
    loading: true,
  },
};

export const WithError: Story = {
  render: (args: any) => ({
    components: { ScheduleTaskDetailDialog },
    setup() {
      const show = ref(true);
      return { args, show };
    },
    template: '<ScheduleTaskDetailDialog v-bind="args" v-model:show="show" />',
  }),
  args: {
    show: true,
    task: mockTask,
    error: 'Failed to load task details.',
  },
};
