import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReminderTasksCard from './ReminderTasksCard.vue';
import type { ScheduleTaskClientDTO } from '@memoflow/contracts/schedule';
import { createScheduleStoryTask } from './story-fixtures';

function makeReminderTask(
  overrides: Parameters<typeof createScheduleStoryTask>[0] & { id: string; name: string },
): ScheduleTaskClientDTO {
  const { id, name, ...restOverrides } = overrides;

  return createScheduleStoryTask({
    id,
    name,
    sourceModule: 'Reminder',
    sourceEntityId: 'reminder-1',
    metadata: {
      payload: {},
      tags: ['reminder'],
      priority: 'Normal',
      timeout: null,
    },
    ...restOverrides,
  });
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
    enabled: false,
    schedule: {
      cronExpression: '0 17 * * 5',
      timezone: 'Asia/Shanghai',
      startDate: null,
      endDate: null,
      maxExecutions: null,
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
