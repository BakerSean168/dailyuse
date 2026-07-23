import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 715: schedule create/resolve response dual bodies retired.
 * CreateScheduleResponseDTO / ResolveConflictResponseDTO / AppliedResolution
 * reuse *ResponseSchema only.
  *
 * Soft residual 829: CalendarEntryClientDTO dual retired via CalendarEntryResponseSchema
 * (see notification-preference-calendar-prefs-client-dto-dual surface).
 */
describe('schedule response dual retired (residual 715)', () => {
  const apiDir = __dirname;
  const requests = readFileSync(resolve(apiDir, 'requests/schedule-requests.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/api/schedule-event.routes.ts'),
    'utf8',
  );

  it('exports create/resolve response schemas as sole response shapes', () => {
    expect(responseSchemas).toContain('Residual 715');
    expect(responseSchemas).toContain('export const CreateScheduleResponseSchema');
    expect(responseSchemas).toContain('export const ResolveConflictResponseSchema');
    expect(responseSchemas).toContain('export const AppliedResolutionSchema');
  });

  it('semantic response types are z.infer aliases without interface dual bodies', () => {
    expect(requests).toContain('Residual 715');
    expect(requests).toContain(
      'export type CreateScheduleResponseDTO = z.infer<typeof CreateScheduleResponseSchema>',
    );
    expect(requests).toContain(
      'export type ResolveConflictResponseDTO = z.infer<typeof ResolveConflictResponseSchema>',
    );
    expect(requests).toContain(
      'export type AppliedResolution = z.infer<typeof AppliedResolutionSchema>',
    );
    expect(requests).not.toMatch(/export interface CreateScheduleResponseDTO\b/);
    expect(requests).not.toMatch(/export interface ResolveConflictResponseDTO\b/);
    expect(requests).not.toMatch(/export interface AppliedResolution\b/);
  });

  it('OpenAPI schedule-event routes use create/resolve response schemas', () => {
    expect(routes).toContain('CreateScheduleResponseSchema');
    expect(routes).toContain('ResolveConflictResponseSchema');
    expect(routes).toContain('successResponse(CreateScheduleResponseSchema');
    expect(routes).toContain('successResponse(ResolveConflictResponseSchema');
  });
});
