import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 262: task contracts drop identity dual response aliases and
 * TaskDomainEvent alias of TaskCreatedEvent.
 */
describe('task instance Res dual single-track surface', () => {
  const apiDir = __dirname;
  const instanceDto = readFileSync(resolve(apiDir, 'task-instance.dto.ts'), 'utf8');
  const rpcMap = readFileSync(resolve(apiDir, '../protocol/task-rpc-map.ts'), 'utf8');
  const eventsIndex = readFileSync(
    resolve(apiDir, '../domain/events/index.ts'),
    'utf8',
  );

  it('does not dual-alias Complete/Skip TaskInstanceRes', () => {
    expect(instanceDto).not.toMatch(/export type CompleteTaskInstanceRes\s*=/);
    expect(instanceDto).not.toMatch(/export type SkipTaskInstanceRes\s*=/);
    // Soft residual 789: operation Res dual retired — ResSchema + z.infer only.
    expect(instanceDto).toContain('Residual 789');
    expect(instanceDto).toContain(
      'export const TaskInstanceOperationResSchema = z.object({',
    );
    expect(instanceDto).toContain(
      'export type TaskInstanceOperationRes = z.infer<typeof TaskInstanceOperationResSchema>',
    );
    expect(instanceDto).not.toMatch(/export interface TaskInstanceOperationRes\b/);
  });

  it('rpc map uses TaskInstanceOperationRes for complete/skip', () => {
    expect(rpcMap).toContain(
      "'task:complete-instance': [CompleteTaskInstanceReq, TaskInstanceOperationRes]",
    );
    expect(rpcMap).toContain(
      "'task:skip-instance': [SkipTaskInstanceReq, TaskInstanceOperationRes]",
    );
    expect(rpcMap).not.toContain('CompleteTaskInstanceRes');
    expect(rpcMap).not.toContain('SkipTaskInstanceRes');
  });

  it('does not dual-export TaskDomainEvent = TaskCreatedEvent', () => {
    expect(eventsIndex).not.toContain('TaskDomainEvent');
    expect(eventsIndex).toContain('TaskCreatedEvent');
  });
});
