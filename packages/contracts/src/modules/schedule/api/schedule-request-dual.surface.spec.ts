import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 707: schedule request dual bodies retired.
 * Create/Update/DetectConflicts/GetByTimeRange/ResolveConflict Request
 * reuse *RequestSchema only.
 */
describe('schedule request dual retired (residual 707)', () => {
  const apiDir = __dirname;
  const requests = readFileSync(resolve(apiDir, 'requests/schedule-requests.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/api/routes.ts'),
    'utf8',
  );

  it('exports request schemas as sole request shapes', () => {
    expect(requests).toContain('Residual 707');
    expect(requests).toContain('export const CreateScheduleRequestSchema = z.object({');
    expect(requests).toContain('export const UpdateScheduleRequestSchema = z.object({');
    expect(requests).toContain('export const DetectConflictsRequestSchema = z.object({');
    expect(requests).toContain(
      'export const GetSchedulesByTimeRangeRequestSchema = z.object({',
    );
    expect(requests).toContain('export const ResolveConflictRequestSchema = z.object({');
  });

  it('semantic Request types are z.infer aliases without interface dual bodies', () => {
    expect(requests).toContain(
      'export type CreateScheduleRequest = z.infer<typeof CreateScheduleRequestSchema>',
    );
    expect(requests).toContain(
      'export type UpdateScheduleRequest = z.infer<typeof UpdateScheduleRequestSchema>',
    );
    expect(requests).toContain(
      'export type DetectConflictsRequest = z.infer<typeof DetectConflictsRequestSchema>',
    );
    expect(requests).toContain(
      'export type GetSchedulesByTimeRangeRequest = z.infer<',
    );
    expect(requests).toContain('typeof GetSchedulesByTimeRangeRequestSchema');
    expect(requests).toContain(
      'export type ResolveConflictRequest = z.infer<typeof ResolveConflictRequestSchema>',
    );
    expect(requests).not.toMatch(/export interface CreateScheduleRequest\b/);
    expect(requests).not.toMatch(/export interface UpdateScheduleRequest\b/);
    expect(requests).not.toMatch(/export interface DetectConflictsRequest\b/);
    expect(requests).not.toMatch(/export interface GetSchedulesByTimeRangeRequest\b/);
    expect(requests).not.toMatch(/export interface ResolveConflictRequest\b/);
  });

  it('keeps internal identity query types as explicit server-side shapes', () => {
    expect(requests).toContain('export interface GetSchedulesByTimeRangeInternalQuery');
    expect(requests).toContain('export interface DetectConflictsInternalQuery');
    expect(requests).toContain('identityId: IdentityId');
  });

  it('OpenAPI schedule-event routes and controller parse request schemas only', () => {
    const eventRoutes = readFileSync(
      resolve(apiDir, '../../../../../schedule/src/api/schedule-event.routes.ts'),
      'utf8',
    );
    const controller = readFileSync(
      resolve(
        apiDir,
        '../../../../../schedule/src/server/transport/schedule-event.controller.ts',
      ),
      'utf8',
    );
    expect(eventRoutes).toContain('CreateScheduleRequestSchema');
    expect(eventRoutes).toContain('DetectConflictsRequestSchema');
    expect(eventRoutes).toContain('ResolveConflictRequestSchema');
    expect(controller).toContain('CreateScheduleRequestSchema.safeParse');
    expect(controller).toContain('DetectConflictsRequestSchema.safeParse');
    expect(controller).toContain('ResolveConflictRequestSchema.safeParse');
  });
});
