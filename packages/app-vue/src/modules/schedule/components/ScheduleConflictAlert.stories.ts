import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScheduleConflictAlert from './ScheduleConflictAlert.vue';
import type { ConflictDetectionResult } from '@dailyuse/contracts/schedule';
import { createScheduleConflict } from './story-fixtures';

const mockConflicts: ConflictDetectionResult = createScheduleConflict({
  suggestions: [
    {
      type: 'MoveLater',
      newStartTime: Date.now() + 60 * 60 * 1000,
      newEndTime: Date.now() + 2 * 60 * 60 * 1000,
      description: 'Move to 1 hour later',
    },
    {
      type: 'Shorten',
      newStartTime: Date.now(),
      newEndTime: Date.now() + 30 * 60 * 1000,
      description: 'Shorten to 30 minutes',
    },
  ],
});

const severeConflicts: ConflictDetectionResult = createScheduleConflict({
  conflicts: [
    {
      scheduleId: 'sched-2' as ConflictDetectionResult['conflicts'][number]['scheduleId'],
      scheduleTitle: 'Client Demo',
      overlapStart: Date.now(),
      overlapEnd: Date.now() + 90 * 60 * 1000,
      overlapDuration: 90 * 60 * 1000,
      severity: 'Severe',
    },
    {
      scheduleId: 'sched-3' as ConflictDetectionResult['conflicts'][number]['scheduleId'],
      scheduleTitle: 'Team Retrospective',
      overlapStart: Date.now() + 30 * 60 * 1000,
      overlapEnd: Date.now() + 120 * 60 * 1000,
      overlapDuration: 90 * 60 * 1000,
      severity: 'Severe',
    },
  ],
  suggestions: [
    {
      type: 'MoveEarlier',
      newStartTime: Date.now() - 3 * 60 * 60 * 1000,
      newEndTime: Date.now() - 2 * 60 * 60 * 1000,
      description: 'Move 3 hours earlier',
    },
  ],
});

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
