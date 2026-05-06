import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalTasksCard from './GoalTasksCard.vue';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createScheduleStoryTask } from './story-fixtures';

function makeTask(
  overrides: Parameters<typeof createScheduleStoryTask>[0] & { id: string; name: string },
): ScheduleTaskClientDTO {
  const { id, name, ...restOverrides } = overrides;

  return createScheduleStoryTask({
    id,
    name,
    sourceModule: 'Goal',
    sourceEntityId: 'goal-1',
    metadata: {
      payload: {},
      tags: ['goal'],
      priority: 'Normal',
      timeout: null,
    },
    ...restOverrides,
  });
}

const mockTasks: ScheduleTaskClientDTO[] = [
  makeTask({ id: 'task-1', name: 'Review quarterly goals' }),
  makeTask({
    id: 'task-2',
    name: 'Update OKR progress',
    status: 'Paused',
    enabled: false,
  }),
  makeTask({
    id: 'task-3',
    name: 'Send goal summary report',
    execution: {
      nextRunAt: null,
      lastRunAt: new Date(Date.now() - 7200000).toISOString(),
      executionCount: 5,
      lastExecutionStatus: 'Failed',
      lastExecutionDuration: 500,
      consecutiveFailures: 3,
    },
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
