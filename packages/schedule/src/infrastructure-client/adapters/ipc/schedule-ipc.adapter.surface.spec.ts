import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ScheduleChannels } from '@dailyuse/contracts/electron';

/**
 * Schedule IPC adapters surface (stage-6 residual):
 * Invokes contracts ScheduleChannels only — no local SCHEDULE_*_CHANNELS dual maps.
 */
describe('Schedule IPC adapters channel surface', () => {
  const files = ['schedule-event-ipc.adapter.ts', 'schedule-task-ipc.adapter.ts'] as const;

  it.each(files)('%s uses ScheduleChannels and no local channel map', (fileName) => {
    const source = readFileSync(resolve(__dirname, fileName), 'utf8');
    expect(source).toContain("import { ScheduleChannels } from '@dailyuse/contracts/electron'");
    expect(source).not.toMatch(/const SCHEDULE_[A-Z_]*CHANNELS = \{/);
    expect(source).toContain('ScheduleChannels.');
  });

  it('covers live schedule event and task channels', () => {
    const event = readFileSync(resolve(__dirname, 'schedule-event-ipc.adapter.ts'), 'utf8');
    const task = readFileSync(resolve(__dirname, 'schedule-task-ipc.adapter.ts'), 'utf8');
    expect(event).toContain('ScheduleChannels.CREATE');
    expect(event).toContain('ScheduleChannels.RESOLVE_CONFLICT');
    expect(task).toContain('ScheduleChannels.TASK_CREATE');
    expect(task).toContain('ScheduleChannels.TASK_UPDATE_METADATA');
    expect(ScheduleChannels.TASK_LIST).toBe('schedule:task:list');
  });
});
