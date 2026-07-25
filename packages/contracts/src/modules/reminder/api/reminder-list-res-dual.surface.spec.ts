import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 693: reminder list response dual bodies retired.
 * ReminderTemplateListRes / ReminderGroupListRes reuse *ListResponseSchema only.
 *
 * Soft residual 827: ReminderGroupClientDTO / ReminderHistoryClientDTO duals retired
 * (see reminder-group-history-client-dto-dual surface).
  *
 * Soft residual 833: ReminderTemplateClientDTO dual retired via ReminderTemplateResponseSchema; ActiveTime uses activatedAt
 * (see reminder-template-active-time-schedule-execution-dual surface).
 */
describe('reminder list response dual retired (residual 693)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const templateDto = readFileSync(resolve(apiDir, 'reminder-template.dto.ts'), 'utf8');
  const groupDto = readFileSync(resolve(apiDir, 'reminder-group.dto.ts'), 'utf8');
  const templateRoutes = readFileSync(
    resolve(apiDir, '../../../../../reminder/src/api/routes/reminder-template.routes.ts'),
    'utf8',
  );
  const groupRoutes = readFileSync(
    resolve(apiDir, '../../../../../reminder/src/api/routes/reminder-group.routes.ts'),
    'utf8',
  );

  it('exports list Response schemas with template/group arrays', () => {
    expect(responseSchemas).toContain('Residual 693');
    expect(responseSchemas).toContain('export const ReminderTemplateListResponseSchema');
    expect(responseSchemas).toContain('export const ReminderGroupListResponseSchema');
    expect(responseSchemas).toContain('templates: z.array(ReminderTemplateResponseSchema)');
    expect(responseSchemas).toContain('groups: z.array(ReminderGroupResponseSchema)');
  });

  it('semantic list Res types are z.infer aliases without interface dual bodies', () => {
    expect(templateDto).toContain('Residual 693');
    expect(templateDto).toContain(
      'export type ReminderTemplateListRes = z.infer<typeof ReminderTemplateListResponseSchema>',
    );
    expect(templateDto).not.toMatch(/export interface ReminderTemplateListRes\b/);

    expect(groupDto).toContain('Residual 693');
    expect(groupDto).toContain(
      'export type ReminderGroupListRes = z.infer<typeof ReminderGroupListResponseSchema>',
    );
    expect(groupDto).not.toMatch(/export interface ReminderGroupListRes\b/);
  });

  it('OpenAPI reminder routes use list Response schemas only', () => {
    expect(templateRoutes).toContain('ReminderTemplateListResponseSchema');
    expect(templateRoutes).toContain('successResponse(ReminderTemplateListResponseSchema');
    expect(groupRoutes).toContain('ReminderGroupListResponseSchema');
    expect(groupRoutes).toContain('successResponse(ReminderGroupListResponseSchema');
  });
});
