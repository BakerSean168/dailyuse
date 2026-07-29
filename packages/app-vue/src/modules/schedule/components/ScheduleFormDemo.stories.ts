import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScheduleFormDemo from './ScheduleFormDemo.vue';
import type { ConflictDetectionResult } from '@memoflow/contracts/schedule';
import { createScheduleConflict } from './story-fixtures';

const mockConflicts: ConflictDetectionResult = createScheduleConflict({
  suggestions: [
    {
      type: 'MoveLater',
      newStartTime: Date.now() + 60 * 60 * 1000,
      newEndTime: Date.now() + 2 * 60 * 60 * 1000,
      description: 'Move to 1 hour later',
    },
  ],
});

const meta = {
  title: 'Business/Schedule/ScheduleFormDemo',
  component: ScheduleFormDemo,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    detectingConflicts: { control: 'boolean' },
  },
  args: {
    loading: false,
    detectingConflicts: false,
  },
} satisfies Meta<typeof ScheduleFormDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithConflicts: Story = {
  args: {
    conflicts: mockConflicts,
  },
};

export const DetectingConflicts: Story = {
  args: {
    detectingConflicts: true,
  },
};

export const Submitting: Story = {
  args: {
    loading: true,
  },
};
