import type { Meta, StoryObj } from '@storybook/vue3';
import TaskInstanceCard from './TaskInstanceCard.vue';
import { TaskInstance } from '@dailyuse/task/domain-client';

const now = Date.now();

function createMockTask(overrides: Record<string, unknown> = {}) {
  return TaskInstance.fromDTO({
    id: '550e8400-e29b-41d4-a716-446655440000',
    templateId: '660e8400-e29b-41d4-a716-446655440001',
    identityId: '770e8400-e29b-41d4-a716-446655440002',
    instanceDate: now,
    timeConfig: {
      timeType: 'TimePoint' as const,
      startDate: now,
      timePoint: 540, // 9:00 AM
      timeRange: null,
    },
    importance: 'Important' as const,
    priority: 1,
    status: 'Pending' as const,
    actualStartTime: null,
    actualEndTime: null,
    comment: null,
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  });
}

const meta = {
  title: 'Business/Task/TaskInstanceCard',
  component: TaskInstanceCard,
  tags: ['autodocs'],
  argTypes: {
    showBorder: { control: 'boolean' },
  },
  args: {
    showBorder: true,
  },
} satisfies Meta<typeof TaskInstanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: {
    task: createMockTask(),
  },
};

export const Completed: Story = {
  args: {
    task: createMockTask({
      status: 'Completed',
      actualEndTime: now,
    }),
  },
};

export const AllDay: Story = {
  args: {
    task: createMockTask({
      timeConfig: {
        timeType: 'AllDay',
        startDate: now,
        timePoint: null,
        timeRange: null,
      },
    }),
  },
};

export const TimeRange: Story = {
  args: {
    task: createMockTask({
      timeConfig: {
        timeType: 'TimeRange',
        startDate: now,
        timePoint: null,
        timeRange: { start: 540, end: 660 }, // 9:00 - 11:00
      },
    }),
  },
};

export const NoBorder: Story = {
  args: {
    task: createMockTask(),
    showBorder: false,
  },
};

export const TaskList: Story = {
  render: () => ({
    components: { TaskInstanceCard },
    setup() {
      const tasks = [
        createMockTask({ id: '1', status: 'Completed', actualEndTime: now }),
        createMockTask({
          id: '2',
          status: 'Pending',
          timeConfig: { timeType: 'TimePoint', startDate: now, timePoint: 600, timeRange: null },
        }),
        createMockTask({
          id: '3',
          status: 'Pending',
          timeConfig: { timeType: 'TimeRange', startDate: now, timePoint: null, timeRange: { start: 780, end: 840 } },
        }),
        createMockTask({
          id: '4',
          status: 'Pending',
          timeConfig: { timeType: 'AllDay', startDate: now, timePoint: null, timeRange: null },
        }),
      ];
      return { tasks };
    },
    template: `
      <div class="border rounded-md max-w-lg">
        <TaskInstanceCard
          v-for="task in tasks"
          :key="String(task.id)"
          :task="task"
          @complete="(id) => console.log('Complete:', id)"
        />
      </div>
    `,
  }),
};
