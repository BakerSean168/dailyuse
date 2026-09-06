import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Desktop Schedule IPC exposes event commands plus read-only worker diagnostics. */
describe('Schedule IPC adapters channel surface', () => {
  it('uses canonical ScheduleChannels only', () => {
    for (const fileName of ['schedule-event-ipc.adapter.ts', 'schedule-task-ipc.adapter.ts']) {
      const source = readFileSync(resolve(__dirname, fileName), 'utf8');
      expect(source).toContain("import { ScheduleChannels } from '@memoflow/contracts/electron'");
      expect(source).not.toMatch(/const SCHEDULE_[A-Z_]*CHANNELS = \{/);
      expect(source).toContain('ScheduleChannels.');
    }
  });

  it('keeps raw ScheduleTask IPC strictly read-only', () => {
    const task = readFileSync(resolve(__dirname, 'schedule-task-ipc.adapter.ts'), 'utf8');
    for (const channel of ['TASK_LIST', 'TASK_GET_BY_ID', 'TASK_GET_DUE', 'TASK_GET_BY_SOURCE']) {
      expect(task).toContain(`ScheduleChannels.${channel}`);
    }
    for (const channel of [
      'TASK_CREATE',
      'TASK_CREATE_BATCH',
      'TASK_PAUSE',
      'TASK_RESUME',
      'TASK_COMPLETE',
      'TASK_CANCEL',
      'TASK_DELETE',
      'TASK_DELETE_BATCH',
      'TASK_UPDATE_METADATA',
    ]) {
      expect(task).not.toContain(`ScheduleChannels.${channel}`);
    }
    expect(task).toContain('implements IScheduleTaskQueryApiClient');
  });
});
