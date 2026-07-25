import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 749: schedule nested VO dual bodies retired.
 * ScheduleConfig/ExecutionInfo/RetryPolicy/TaskMetadata DTOs reuse *Schema only.
 * Request modules keep local partial schemas (different shapes/validation).
 */
describe('schedule nested VO dual retired (residual 749)', () => {
  const apiDir = __dirname;
  const scheduleConfig = readFileSync(
    resolve(apiDir, '../value-objects/schedule-config.ts'),
    'utf8',
  );
  const executionInfo = readFileSync(
    resolve(apiDir, '../value-objects/execution-info.ts'),
    'utf8',
  );
  const retryPolicy = readFileSync(
    resolve(apiDir, '../value-objects/retry-policy.ts'),
    'utf8',
  );
  const taskMetadata = readFileSync(
    resolve(apiDir, '../value-objects/task-metadata.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const requests = readFileSync(
    resolve(apiDir, 'requests/schedule-task-requests.ts'),
    'utf8',
  );

  it('exports nested VO schemas as sole shapes from VO modules', () => {
    expect(scheduleConfig).toContain('Residual 749');
    expect(scheduleConfig).toContain('export const ScheduleConfigSchema = z.object({');
    expect(executionInfo).toContain('Residual 749');
    expect(executionInfo).toContain('export const ExecutionInfoSchema = z.object({');
    expect(retryPolicy).toContain('Residual 749');
    expect(retryPolicy).toContain('export const RetryPolicySchema = z.object({');
    expect(taskMetadata).toContain('Residual 749');
    expect(taskMetadata).toContain('export const TaskMetadataSchema = z.object({');
  });

  it('semantic DTOs are z.infer aliases without interface dual bodies', () => {
    expect(scheduleConfig).toContain(
      'export type ScheduleConfigDTO = z.infer<typeof ScheduleConfigSchema>',
    );
    expect(scheduleConfig).not.toMatch(/export interface ScheduleConfigDTO\b/);
    expect(executionInfo).toContain(
      'export type ExecutionInfoDTO = z.infer<typeof ExecutionInfoSchema>',
    );
    expect(executionInfo).not.toMatch(/export interface ExecutionInfoDTO\b/);
    expect(retryPolicy).toContain(
      'export type RetryPolicyDTO = z.infer<typeof RetryPolicySchema>',
    );
    expect(retryPolicy).not.toMatch(/export interface RetryPolicyDTO\b/);
    expect(taskMetadata).toContain(
      'export type TaskMetadataDTO = z.infer<typeof TaskMetadataSchema>',
    );
    expect(taskMetadata).not.toMatch(/export interface TaskMetadataDTO\b/);
  });

  it('response-schemas re-exports VO-owned schemas (no local dual bodies)', () => {
    expect(responseSchemas).toContain('Residual 749');
    expect(responseSchemas).toContain("from '../value-objects/schedule-config'");
    expect(responseSchemas).toContain("from '../value-objects/execution-info'");
    expect(responseSchemas).toContain("from '../value-objects/retry-policy'");
    expect(responseSchemas).toContain("from '../value-objects/task-metadata'");
    expect(responseSchemas).toContain('export {');
    expect(responseSchemas).toContain('ScheduleConfigSchema');
    expect(responseSchemas).not.toMatch(
      /const ScheduleConfigSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /const ExecutionInfoSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /const RetryPolicySchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /const TaskMetadataSchema = z\.object\(\{/,
    );
    expect(responseSchemas).toContain('schedule: ScheduleConfigSchema');
    expect(responseSchemas).toContain('execution: ExecutionInfoSchema');
    expect(responseSchemas).toContain('retryPolicy: RetryPolicySchema');
    expect(responseSchemas).toContain('metadata: TaskMetadataSchema');
  });

  it('request module keeps local partial schemas (not response dual reuse)', () => {
    // Soft residual lock: request validation intentionally differs from response DTOs.
    expect(requests).toContain('const ScheduleConfigSchema = z.object({');
    expect(requests).toContain('startDate: z.number().nullable().optional()');
    expect(requests).toContain('const RetryPolicySchema = z.object({');
    // Request retry policy omits required response field `enabled`.
    expect(requests).not.toMatch(
      /const RetryPolicySchema = z\.object\(\{[^}]*enabled:/s,
    );
  });
});
