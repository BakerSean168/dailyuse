import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 260: schedule detail response dual aliases are gone.
 * Callers use ScheduleTaskClientDTO / ScheduleExecutionClientDTO directly.
 */
describe('schedule Schedule*DTO dual single-track surface', () => {
  const apiDir = __dirname;
  const taskReq = readFileSync(resolve(apiDir, 'requests/schedule-task-requests.ts'), 'utf8');
  const execReq = readFileSync(
    resolve(apiDir, 'requests/schedule-execution-requests.ts'),
    'utf8',
  );

  it('does not dual-alias ScheduleTaskDTO / ScheduleExecutionDTO', () => {
    expect(taskReq).not.toMatch(/export type ScheduleTaskDTO\s*=/);
    expect(execReq).not.toMatch(/export type ScheduleExecutionDTO\s*=/);
    expect(taskReq).not.toContain('export type ScheduleTaskDTO');
    expect(execReq).not.toContain('export type ScheduleExecutionDTO');
  });

  it('list/detail response shapes use ClientDTO names', () => {
    expect(taskReq).toContain('ScheduleTaskClientDTO');
    expect(execReq).toContain('ScheduleExecutionClientDTO');
  });
});
