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
  const rpcMap = readFileSync(resolve(apiDir, '../protocol/schedule-rpc-map.ts'), 'utf8');

  it('does not dual-alias ScheduleTaskDTO / ScheduleExecutionDTO', () => {
    expect(taskReq).not.toMatch(/export type ScheduleTaskDTO\s*=/);
    expect(execReq).not.toMatch(/export type ScheduleExecutionDTO\s*=/);
    expect(taskReq).not.toContain('export type ScheduleTaskDTO');
    expect(execReq).not.toContain('export type ScheduleExecutionDTO');
  });

  it('list/detail transport shapes use ClientDTO names (not dead list duals)', () => {
    expect(rpcMap).toContain('ScheduleTaskClientDTO');
    expect(rpcMap).toContain('ScheduleExecutionClientDTO');
    expect(taskReq).not.toMatch(/export interface ScheduleTaskListResponseDTO\b/);
    expect(execReq).not.toMatch(/export interface ScheduleExecutionListResponseDTO\b/);
    expect(execReq).not.toMatch(/export interface ExecutionHistoryStatsDTO\b/);
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

/**
 * Residual 639: shared BatchOperationResponseDTO dual name retired.
 * Schedule batch results use ScheduleBatchOperationResponseDTO only.
 */
describe('schedule batch operation response dual name retired (residual 639)', () => {
  const apiDir = __dirname;
  const taskReq = readFileSync(resolve(apiDir, 'requests/schedule-task-requests.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const sharedDtosIndex = readFileSync(
    resolve(apiDir, '../../../shared/dtos/index.ts'),
    'utf8',
  );

  it('does not export shared BatchOperationResponseDTO dual', () => {
    expect(sharedDtosIndex).not.toMatch(/export\s+type\s*\{\s*BatchOperationResponseDTO/);
    expect(sharedDtosIndex).not.toContain('batch-operation-res');
    expect(sharedDtosIndex).toContain('Residual 641');
  });

  it('schedule uses ScheduleBatchOperationResponseDTO / Schema only', () => {
    expect(taskReq).toContain('Residual 639');
    expect(taskReq).toContain('export interface ScheduleBatchOperationResponseDTO');
    expect(taskReq).not.toMatch(/export interface BatchOperationResponseDTO\b/);
    expect(responseSchemas).toContain('ScheduleBatchOperationResponseSchema');
    expect(responseSchemas).not.toMatch(/export const BatchOperationResponseSchema\b/);
  });
});

/**
 * Residual 665: schedule batch-delete OpenAPI schema dual retired.
 * POST /tasks/batch and /tasks/batch/delete both document ScheduleBatchOperationResponseSchema.
 */
describe('schedule batch-delete response schema dual retired (residual 665)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/api/routes.ts'),
    'utf8',
  );

  it('does not export a separate batch-delete response schema dual', () => {
    expect(responseSchemas).toContain('Residual 665');
    expect(responseSchemas).not.toMatch(/export const BatchDeleteResponseSchema\b/);
    expect(responseSchemas).toContain('export const ScheduleBatchOperationResponseSchema');
  });

  it('batch and batch-delete routes share ScheduleBatchOperationResponseSchema', () => {
    expect(routes).not.toContain('BatchDeleteResponseSchema');
    expect(routes).toContain('ScheduleBatchOperationResponseSchema');
    const sharedSchemaHits = routes.split(
      'successResponse(ScheduleBatchOperationResponseSchema',
    ).length - 1;
    expect(sharedSchemaHits).toBeGreaterThanOrEqual(2);
  });
});

/**
 * Residual 663: schedule dead list/stats ResponseDTO duals + detect-conflicts wrapper dual retired.
 * Live detect-conflicts / get-conflicts bodies are ConflictDetectionResult (RPC + client + OpenAPI).
 */
describe('schedule list/stats + detect-conflicts dual retired (residual 663)', () => {
  const apiDir = __dirname;
  const taskReq = readFileSync(resolve(apiDir, 'requests/schedule-task-requests.ts'), 'utf8');
  const execReq = readFileSync(
    resolve(apiDir, 'requests/schedule-execution-requests.ts'),
    'utf8',
  );
  const scheduleReq = readFileSync(resolve(apiDir, 'requests/schedule-requests.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const rpcMap = readFileSync(resolve(apiDir, '../protocol/schedule-rpc-map.ts'), 'utf8');

  it('does not export dead task/execution list or stats ResponseDTO duals', () => {
    expect(taskReq).toContain('Residual 663');
    expect(execReq).toContain('Residual 663');
    expect(taskReq).not.toMatch(/export interface ScheduleTaskListResponseDTO\b/);
    expect(execReq).not.toMatch(/export interface ScheduleExecutionListResponseDTO\b/);
    expect(execReq).not.toMatch(/export interface ExecutionHistoryStatsDTO\b/);
  });

  it('detect-conflicts has no { result } response dual wrapper', () => {
    expect(scheduleReq).toContain('Residual 663');
    expect(scheduleReq).not.toMatch(/export interface DetectConflictsResponseDTO\b/);
    expect(responseSchemas).toContain('Residual 663');
    expect(responseSchemas).toContain(
      'export const DetectConflictsResponseSchema = ConflictDetectionResultSchema',
    );
    expect(responseSchemas).not.toMatch(
      /DetectConflictsResponseSchema\s*=\s*z\.object\(\{\s*result:/,
    );
    expect(rpcMap).toContain('ConflictDetectionResult');
    expect(rpcMap).toMatch(
      /'schedule:detect-conflicts':\s*\[[\s\S]*ConflictDetectionResult[\s\S]*?\]/,
    );
  });
});
