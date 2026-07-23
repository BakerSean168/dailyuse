import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 827: ReminderGroupClientDTO / ReminderHistoryClientDTO dual bodies retired.
 * Sole *ResponseSchema + z.infer (semantic ClientDTO is z.infer alias).
 */
describe('reminder group/history client dto duals retired (residual 827)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const group = readFileSync(
    resolve(apiDir, '../aggregates/reminder-group-client.ts'),
    'utf8',
  );
  const history = readFileSync(
    resolve(apiDir, '../entities/reminder-history-client.ts'),
    'utf8',
  );
  const groupRoutes = readFileSync(
    resolve(apiDir, '../../../../../reminder/src/api/routes/reminder-group.routes.ts'),
    'utf8',
  );
  const templateRoutes = readFileSync(
    resolve(apiDir, '../../../../../reminder/src/api/routes/reminder-template.routes.ts'),
    'utf8',
  );

  it('owns ReminderGroupClientDTO as z.infer of ReminderGroupResponseSchema', () => {
    expect(group).toContain('Residual 827');
    expect(group).toContain("from '../api/response-schemas'");
    expect(group).toContain(
      'export type ReminderGroupClientDTO = z.infer<typeof ReminderGroupResponseSchema>',
    );
    expect(group).not.toMatch(/export interface ReminderGroupClientDTO\b/);
    expect(responseSchemas).toContain('Residual 827');
    expect(responseSchemas).toContain(
      'export const ReminderGroupResponseSchema = z.object({',
    );
    expect(responseSchemas).toContain('stats: GroupStatsSchema');
  });

  it('owns ReminderHistoryClientDTO as z.infer of ReminderHistoryResponseSchema', () => {
    expect(history).toContain('Residual 827');
    expect(history).toContain("from '../api/response-schemas'");
    expect(history).toContain(
      'export type ReminderHistoryClientDTO = z.infer<typeof ReminderHistoryResponseSchema>',
    );
    expect(history).not.toMatch(/export interface ReminderHistoryClientDTO\b/);
    expect(responseSchemas).toContain(
      'export const ReminderHistoryResponseSchema = z.object({',
    );
    expect(responseSchemas).toContain(
      'notificationChannels: z.array(z.enum(NotificationChannel)).nullable()',
    );
  });

  it('OpenAPI group/history routes and list envelopes use ResponseSchemas', () => {
    expect(groupRoutes).toContain('ReminderGroupResponseSchema');
    expect(groupRoutes).toContain(
      "successResponse(ReminderGroupResponseSchema, '创建成功')",
    );
    expect(templateRoutes).toContain('ReminderHistoryResponseSchema');
    expect(templateRoutes).toContain(
      "successResponse(z.array(ReminderHistoryResponseSchema), '获取成功')",
    );
    expect(responseSchemas).toContain('groups: z.array(ReminderGroupResponseSchema)');
  });
});
