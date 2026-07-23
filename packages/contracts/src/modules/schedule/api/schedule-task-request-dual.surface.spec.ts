import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 709: schedule-task request dual bodies retired.
 * Create/Update/Config/Metadata/Batch Request reuse *RequestSchema only.
 */
describe('schedule-task request dual retired (residual 709)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'requests/schedule-task-requests.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/api/routes.ts'),
    'utf8',
  );
  const controller = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/server/transport/schedule.controller.ts'),
    'utf8',
  );

  it('exports schedule-task request schemas as sole request shapes', () => {
    expect(dto).toContain('Residual 709');
    expect(dto).toContain('export const CreateScheduleTaskRequestSchema = z.object({');
    expect(dto).toContain('export const UpdateScheduleTaskRequestSchema = z.object({');
    expect(dto).toContain('export const UpdateScheduleConfigRequestSchema = z.object({');
    expect(dto).toContain('export const UpdateTaskMetadataRequestSchema = z.object({');
    expect(dto).toContain(
      'export const BatchScheduleTaskOperationRequestSchema = z.object({',
    );
  });

  it('semantic Request types are z.infer aliases without interface dual bodies', () => {
    expect(dto).toContain(
      'export type CreateScheduleTaskRequest = z.infer<typeof CreateScheduleTaskRequestSchema>',
    );
    expect(dto).toContain(
      'export type UpdateScheduleTaskRequest = z.infer<typeof UpdateScheduleTaskRequestSchema>',
    );
    expect(dto).toContain(
      'export type UpdateScheduleConfigRequest = z.infer<typeof UpdateScheduleConfigRequestSchema>',
    );
    expect(dto).toContain(
      'export type UpdateTaskMetadataRequest = z.infer<typeof UpdateTaskMetadataRequestSchema>',
    );
    expect(dto).toContain(
      'export type BatchScheduleTaskOperationRequest = z.infer<',
    );
    expect(dto).toContain('typeof BatchScheduleTaskOperationRequestSchema');
    expect(dto).not.toMatch(/export interface CreateScheduleTaskRequest\b/);
    expect(dto).not.toMatch(/export interface UpdateScheduleTaskRequest\b/);
    expect(dto).not.toMatch(/export interface UpdateScheduleConfigRequest\b/);
    expect(dto).not.toMatch(/export interface UpdateTaskMetadataRequest\b/);
    expect(dto).not.toMatch(/export interface BatchScheduleTaskOperationRequest\b/);
  });

  it('keeps ScheduleBatchOperationResponseDTO interface (residual 639 schedule-scoped)', () => {
    expect(dto).toContain('export interface ScheduleBatchOperationResponseDTO');
  });

  it('routes and controller use schedule-task request schemas', () => {
    expect(routes).toContain('CreateScheduleTaskRequestSchema');
    expect(routes).toContain('UpdateScheduleTaskRequestSchema');
    expect(routes).toContain('BatchScheduleTaskOperationRequestSchema');
    expect(controller).toContain('ScheduleTaskQueryParamsSchema');
  });
});
