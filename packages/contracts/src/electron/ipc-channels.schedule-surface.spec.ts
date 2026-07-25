import { describe, expect, it } from 'vitest';
import { ScheduleChannels } from './ipc-channels';

/**
 * Schedule IPC surface (stage-6 residual):
 * Unsupported schedule event complete/cancel/reschedule stay retired from contracts.
 */
describe('ScheduleChannels surface', () => {
  it('does not expose retired unsupported event lifecycle channels', () => {
    for (const key of ['COMPLETE', 'CANCEL', 'RESCHEDULE'] as const) {
      expect(ScheduleChannels).not.toHaveProperty(key);
    }
    for (const channel of ['schedule:complete', 'schedule:cancel', 'schedule:reschedule']) {
      expect(Object.values(ScheduleChannels)).not.toContain(channel);
    }
  });

  it('keeps live event and task channels used by Schedule IPC adapters', () => {
    expect(ScheduleChannels.LIST).toBe('schedule:list');
    expect(ScheduleChannels.CREATE_WITH_CONFLICT_DETECTION).toBe(
      'schedule:create-with-conflict-detection',
    );
    expect(ScheduleChannels.TASK_CREATE).toBe('schedule:task:create');
    expect(ScheduleChannels.TASK_UPDATE_METADATA).toBe('schedule:task:update-metadata');
  });
});
