import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ConflictAlert from './ConflictAlert.vue';
import type { ConflictDetectionResult } from '@memoflow/contracts/schedule';
import { createScheduleConflict } from './story-fixtures';

const mockConflict: ConflictDetectionResult = createScheduleConflict({
  suggestions: [
    {
      type: 'MoveLater',
      newStartTime: Date.now() + 60 * 60 * 1000,
      newEndTime: Date.now() + 2 * 60 * 60 * 1000,
      description: 'Move to 1 hour later to avoid conflict',
    },
  ],
});

const severeConflict: ConflictDetectionResult = createScheduleConflict({
  conflicts: [
    {
      scheduleId: 'sched-2' as ConflictDetectionResult['conflicts'][number]['scheduleId'],
      scheduleTitle: 'Sprint Planning',
      overlapStart: Date.now(),
      overlapEnd: Date.now() + 60 * 60 * 1000,
      overlapDuration: 60 * 60 * 1000,
      severity: 'Severe',
    },
    {
      scheduleId: 'sched-3' as ConflictDetectionResult['conflicts'][number]['scheduleId'],
      scheduleTitle: 'Design Review',
      overlapStart: Date.now() + 30 * 60 * 1000,
      overlapEnd: Date.now() + 90 * 60 * 1000,
      overlapDuration: 60 * 60 * 1000,
      severity: 'Moderate',
    },
  ],
  suggestions: [
    {
      type: 'MoveEarlier',
      newStartTime: Date.now() - 2 * 60 * 60 * 1000,
      newEndTime: Date.now() - 60 * 60 * 1000,
      description: 'Move 2 hours earlier',
    },
    {
      type: 'Shorten',
      newStartTime: Date.now(),
      newEndTime: Date.now() + 30 * 60 * 1000,
      description: 'Shorten to 30 minutes',
    },
  ],
});

const noConflict: ConflictDetectionResult = {
  hasConflict: false,
  conflicts: [],
  suggestions: [],
};

const meta = {
  title: 'Business/Schedule/ConflictAlert',
  component: ConflictAlert,
  tags: ['autodocs'],
  argTypes: {
    dismissible: { control: 'boolean' },
  },
  args: {
    conflictResult: mockConflict,
    dismissible: true,
  },
} satisfies Meta<typeof ConflictAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    conflictResult: mockConflict,
  },
};

export const SevereMultipleConflicts: Story = {
  args: {
    conflictResult: severeConflict,
  },
};

export const NoConflict: Story = {
  args: {
    conflictResult: noConflict,
  },
};

export const NotDismissible: Story = {
  args: {
    conflictResult: mockConflict,
    dismissible: false,
  },
};
