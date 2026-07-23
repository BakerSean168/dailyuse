import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 775: upcoming/today reminder schedule list Res duals retired.
 * Shared ReminderScheduleListResSchema; semantic Res are z.infer aliases.
 */
describe('reminder schedule list res duals retired (residual 775)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'reminder-template.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../reminder/src/api/routes/reminder-template.routes.ts'),
    'utf8',
  );

  it('owns shared list ResSchema and z.infer aliases', () => {
    expect(dto).toContain('Residual 775');
    expect(dto).toContain(
      'export const ReminderScheduleListResSchema = z.object({',
    );
    expect(dto).toContain(
      'export const GetUpcomingRemindersResSchema = ReminderScheduleListResSchema',
    );
    expect(dto).toContain(
      'export const GetReminderTodayScheduleResSchema = ReminderScheduleListResSchema',
    );
    expect(dto).toContain(
      'export type GetUpcomingRemindersRes = z.infer<typeof GetUpcomingRemindersResSchema>',
    );
    expect(dto).toContain(
      'export type GetReminderTodayScheduleRes = z.infer<typeof GetReminderTodayScheduleResSchema>',
    );
    expect(dto).not.toMatch(/export interface GetUpcomingRemindersRes\b/);
    expect(dto).not.toMatch(/export interface GetReminderTodayScheduleRes\b/);
  });

  it('OpenAPI routes use shared Res schemas without inline dual bodies', () => {
    expect(routes).toContain('GetUpcomingRemindersResSchema');
    expect(routes).toContain('GetReminderTodayScheduleResSchema');
    expect(routes).toContain(
      "successResponse(GetUpcomingRemindersResSchema, '获取成功')",
    );
    expect(routes).toContain(
      "successResponse(GetReminderTodayScheduleResSchema, '获取成功')",
    );
    expect(routes).not.toMatch(
      /successResponse\(\s*z\.object\(\{\s*data:\s*z\.array\(ReminderTodayScheduleItemSchema\)/,
    );
  });

  it('list items nest ReminderTodayScheduleItemSchema', () => {
    expect(dto).toContain(
      'export const ReminderTodayScheduleItemSchema = z.object({',
    );
    expect(dto).toContain(
      'data: z.array(ReminderTodayScheduleItemSchema)',
    );
  });
});
