import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ScheduleChannels } from '@memoflow/contracts/electron';

/**
 * Schedule electron seam surface (stage-6 residual):
 * Register via contracts ScheduleChannels only — no EventCh/TaskCh dual maps, and no
 * unsupported schedule:complete/cancel/reschedule throw-only event channels.
 */
describe('ScheduleElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via ScheduleChannels and does not redefine local channel maps', () => {
    expect(source).toContain('ScheduleChannels');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).not.toMatch(/const EventCh = \{/);
    expect(source).not.toMatch(/const TaskCh = \{/);
    expect(source).toContain('Object.values(ScheduleChannels)');
    expect(source).toContain('ScheduleChannels.LIST');
    expect(source).toContain('ScheduleChannels.TASK_CREATE');
  });

  it('does not expose retired unsupported event complete/cancel/reschedule channels', () => {
    expect(source).not.toContain("'schedule:complete'");
    expect(source).not.toContain("'schedule:cancel'");
    expect(source).not.toContain("'schedule:reschedule'");
    expect(Object.values(ScheduleChannels)).not.toContain('schedule:complete');
    expect(Object.values(ScheduleChannels)).not.toContain('schedule:cancel');
    expect(Object.values(ScheduleChannels)).not.toContain('schedule:reschedule');
  });

  it('DELETE IPC handler forwards expectedVersion payload to the controller', () => {
    const source = readFileSync(
      resolve(__dirname, 'index.ts'),
      'utf8',
    );
    // The Electron handler must parse the numeric expectedVersion into a payload
    // and pass it to controller.delete(id, payload, requestContext) — no fabrication.
    expect(source).toMatch(/ScheduleChannels\.DELETE[\s\S]*eventController\.delete\(id, payload, requestContext\)/);
    expect(source).toMatch(/typeof input === 'number' \? \{ expectedVersion: input \} : input/);
  });
});
