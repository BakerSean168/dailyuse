import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FocusModeHistoryPanel from './FocusModeHistoryPanel.vue';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const mockGoals = [
  { id: 'g1', title: '提升团队交付效率' },
  { id: 'g2', title: '优化系统性能' },
  { id: 'g3', title: '完善用户体验' },
];

const mockHistory = [
  {
    id: 'fm-1',
    focusedGoalIds: ['g1', 'g2'],
    startTime: now - 10 * day,
    endTime: now + 20 * day,
    hiddenGoalsMode: 'hide' as const,
    isActive: true,
  },
  {
    id: 'fm-2',
    focusedGoalIds: ['g3'],
    startTime: now - 60 * day,
    endTime: now - 30 * day,
    hiddenGoalsMode: 'dim' as const,
    isActive: false,
  },
  {
    id: 'fm-3',
    focusedGoalIds: ['g1'],
    startTime: now - 5 * day,
    endTime: now - 1 * day,
    hiddenGoalsMode: 'collapse' as const,
    isActive: true,
  },
];

const meta = {
  title: 'Business/Goal/FocusModeHistoryPanel',
  component: FocusModeHistoryPanel,
  tags: ['autodocs'],
  args: {
    focusModeHistory: mockHistory,
    goals: mockGoals,
    isLoading: false,
  },
} satisfies Meta<typeof FocusModeHistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isLoading: true,
    focusModeHistory: [],
  },
};

export const Empty: Story = {
  args: {
    focusModeHistory: [],
  },
};

export const SingleActive: Story = {
  args: {
    focusModeHistory: [mockHistory[0]],
  },
};
