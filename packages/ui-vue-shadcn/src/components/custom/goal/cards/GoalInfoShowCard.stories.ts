import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GoalInfoShowCard from './GoalInfoShowCard.vue';
import { createMockGoal, createMockKeyResults } from '../__stories__/mock-data';

const mockGoal = createMockGoal();

const meta = {
  title: 'Business/Goal/Cards/GoalInfoShowCard',
  component: GoalInfoShowCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 560px;"><story /></div>' })],
  argTypes: {
    goal: { description: '目标数据（含 keyResults）', control: 'object' },
  },
} satisfies Meta<typeof GoalInfoShowCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { goal: mockGoal },
};

export const NoKeyResults: Story = {
  args: { goal: createMockGoal({ keyResults: [] } as any) },
};

export const Completed: Story = {
  args: {
    goal: createMockGoal({
      status: 'Completed',
      keyResults: createMockKeyResults().map((kr) => ({
        ...kr,
        progress: { ...kr.progress, currentValue: kr.progress.targetValue },
      })),
    } as any),
  },
};
