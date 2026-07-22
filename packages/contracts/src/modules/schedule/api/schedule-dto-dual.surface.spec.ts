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

/**
 * Residual 631: schedule operation success/error dual envelopes retired.
 * Delete RPC success bodies are `null` (transport data:null), same as governance/reminder void deletes.
 */
describe('schedule operation response dual retired (residual 631)', () => {
  const apiDir = __dirname;
  const requestsIndex = readFileSync(resolve(apiDir, 'requests/index.ts'), 'utf8');
  const rpcMap = readFileSync(resolve(apiDir, '../protocol/schedule-rpc-map.ts'), 'utf8');

  it('does not export ScheduleOperationSuccess/Error dual DTOs', () => {
    expect(requestsIndex).not.toContain('common-responses');
    expect(requestsIndex).not.toContain('ScheduleOperationSuccessResponseDTO');
    expect(requestsIndex).not.toContain('ScheduleErrorResponseDTO');
  });

  it('delete RPC map entries use null void success body', () => {
    expect(rpcMap).toContain('Residual 631');
    expect(rpcMap).toContain("'schedule:delete': [{ scheduleId: ScheduleId }, null]");
    expect(rpcMap).toContain("'schedule-task:delete': [{ taskId: ScheduleTaskId }, null]");
    expect(rpcMap).not.toContain('ScheduleOperationSuccessResponseDTO');
    expect(rpcMap).not.toContain('common-responses');
  });
});

