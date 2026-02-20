import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalTimelineView from './GoalTimelineView.vue';

const mockGoal = {
  id: 'g1',
  title: '提升产品月活用户',
  startDate: '2024-01-01',
  endDate: '2024-06-30',
  progress: 65,
  status: 'on_track',
  keyResults: [
    { id: 'kr1', title: '月活达到 50,000', progress: 80, weight: 50 },
    { id: 'kr2', title: '日均使用时长 30 分钟', progress: 50, weight: 50 },
  ],
  milestones: [
    { id: 'm1', title: '产品 v2.0 上线', date: '2024-02-15', completed: true },
    { id: 'm2', title: '用户增长活动启动', date: '2024-04-01', completed: true },
    { id: 'm3', title: '年中复盘', date: '2024-06-30', completed: false },
  ],
};

const meta = {
  title: 'Business/Goal/Timeline/GoalTimelineView',
  component: GoalTimelineView,
  tags: ['autodocs'],
  args: {
    goal: mockGoal,
  },
  decorators: [() => ({ template: '<div style="max-width: 700px;"><story /></div>' })],
} satisfies Meta<typeof GoalTimelineView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CompletedGoal: Story = {
  args: {
    goal: {
      ...mockGoal,
      progress: 100,
      status: 'completed',
      keyResults: mockGoal.keyResults.map((kr) => ({ ...kr, progress: 100 })),
      milestones: mockGoal.milestones.map((m) => ({ ...m, completed: true })),
    },
  },
};

export const EarlyStage: Story = {
  args: {
    goal: {
      ...mockGoal,
      progress: 10,
      status: 'on_track',
      keyResults: [
        { id: 'kr1', title: '需求调研完成', progress: 20, weight: 40 },
        { id: 'kr2', title: '技术方案评审', progress: 5, weight: 60 },
      ],
      milestones: [
        { id: 'm1', title: '项目启动会', date: '2024-01-15', completed: true },
        { id: 'm2', title: '技术方案确认', date: '2024-03-01', completed: false },
      ],
    },
  },
};
