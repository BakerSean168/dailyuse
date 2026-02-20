import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FocusModeHistoryPanel from './FocusModeHistoryPanel.vue';
import type { FocusModeClientDTO } from '@dailyuse/contracts/goal';

const now = Date.now();
const DAY = 86400000;

const mockHistory: FocusModeClientDTO[] = [
  {
    id: 'fm-1',
    focusedGoalIds: ['goal-1', 'goal-2'],
    startTime: now - 14 * DAY,
    endTime: now + 7 * DAY,
    hiddenGoalsMode: 'hide',
    isActive: true,
  },
  {
    id: 'fm-2',
    focusedGoalIds: ['goal-3'],
    startTime: now - 45 * DAY,
    endTime: now - 15 * DAY,
    hiddenGoalsMode: 'dim',
    isActive: false,
  },
  {
    id: 'fm-3',
    focusedGoalIds: ['goal-1'],
    startTime: now - 90 * DAY,
    endTime: now - 75 * DAY,
    hiddenGoalsMode: 'collapse',
    isActive: false,
  },
] as unknown as FocusModeClientDTO[];

const mockGoals = [
  { id: 'goal-1', title: '提升编程能力' },
  { id: 'goal-2', title: '健康管理' },
  { id: 'goal-3', title: '完成项目重构' },
];

const meta = {
  title: 'Business/Goal/FocusModeHistoryPanel',
  component: FocusModeHistoryPanel,
  tags: ['autodocs'],
  argTypes: {
    focusModeHistory: { description: '专注周期历史列表', control: 'object' },
    isLoading: { description: '加载状态', control: 'boolean' },
    goals: { description: '目标列表（用于显示目标名称）', control: 'object' },
  },
} satisfies Meta<typeof FocusModeHistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { focusModeHistory: mockHistory, isLoading: false, goals: mockGoals },
};

export const Empty: Story = {
  args: { focusModeHistory: [], isLoading: false, goals: [] },
};

export const Loading: Story = {
  args: { focusModeHistory: [], isLoading: true, goals: [] },
};
