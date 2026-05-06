import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskModuleTasksCard from './TaskModuleTasksCard.vue';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createScheduleStoryTask } from './story-fixtures';

function makeTaskModuleTask(
  overrides: Parameters<typeof createScheduleStoryTask>[0] & { id: string; name: string },
): ScheduleTaskClientDTO {
  const { id, name, ...restOverrides } = overrides;

  return createScheduleStoryTask({
    id,
    name,
    sourceModule: 'Task',
    sourceEntityId: 'task-entity-1',
    metadata: {
      payload: {},
      tags: ['task'],
      priority: 'Normal',
      timeout: null,
    },
    ...restOverrides,
  });
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
    enabled: false,
  }),
  makeTaskModuleTask({
    id: 'tm-4',
    name: 'Generate task analytics report',
    execution: {
      nextRunAt: null,
      lastRunAt: new Date(Date.now() - 86400000).toISOString(),
      executionCount: 8,
      lastExecutionStatus: 'Failed',
      lastExecutionDuration: 300,
      consecutiveFailures: 2,
    },
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
