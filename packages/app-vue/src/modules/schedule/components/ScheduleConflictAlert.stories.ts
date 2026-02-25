import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScheduleConflictAlert from './ScheduleConflictAlert.vue';
import type { ConflictDetectionResult } from '@dailyuse/contracts/schedule';

const mockConflicts: ConflictDetectionResult = {
  hasConflict: true,
  conflicts: [
    {
      scheduleId: 'sched-1',
      scheduleTitle: 'Sprint Planning',
      overlapStart: Date.now(),
      overlapEnd: Date.now() + 45 * 60 * 1000,
      overlapDuration: 45 * 60 * 1000,
      severity: 'moderate',
    },
  ],
  suggestions: [
    {
      type: 'move_later',
      newStartTime: Date.now() + 60 * 60 * 1000,
      newEndTime: Date.now() + 2 * 60 * 60 * 1000,
      description: 'Move to 1 hour later',
    },
    {
      type: 'shorten',
      newStartTime: Date.now(),
      newEndTime: Date.now() + 30 * 60 * 1000,
      description: 'Shorten to 30 minutes',
    },
  ],
};

const severeConflicts: ConflictDetectionResult = {
  hasConflict: true,
  conflicts: [
    {
      scheduleId: 'sched-2',
      scheduleTitle: 'Client Demo',
      overlapStart: Date.now(),
      overlapEnd: Date.now() + 90 * 60 * 1000,
      overlapDuration: 90 * 60 * 1000,
      severity: 'severe',
    },
    {
      scheduleId: 'sched-3',
      scheduleTitle: 'Team Retrospective',
      overlapStart: Date.now() + 30 * 60 * 1000,
      overlapEnd: Date.now() + 120 * 60 * 1000,
      overlapDuration: 90 * 60 * 1000,
      severity: 'severe',
    },
  ],
  suggestions: [
    {
      type: 'move_earlier',
      newStartTime: Date.now() - 3 * 60 * 60 * 1000,
      newEndTime: Date.now() - 2 * 60 * 60 * 1000,
      description: 'Move 3 hours earlier',
    },
  ],
};

const noConflicts: ConflictDetectionResult = {
  hasConflict: false,
  conflicts: [],
  suggestions: [],
};

const meta = {
  title: 'Business/Schedule/ScheduleConflictAlert',
  component: ScheduleConflictAlert,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    conflicts: mockConflicts,
    isLoading: false,
  },
} satisfies Meta<typeof ScheduleConflictAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    conflicts: mockConflicts,
    isLoading: false,
  },
};

export const SevereConflicts: Story = {
  args: {
    conflicts: severeConflicts,
    isLoading: false,
  },
};

export const NoConflicts: Story = {
  args: {
    conflicts: noConflicts,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    conflicts: null,
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    conflicts: null,
    isLoading: false,
    error: 'Failed to detect schedule conflicts.',
  },
};
