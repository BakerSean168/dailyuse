import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 829: NotificationPreferenceClientDTO / CalendarEntryClientDTO /
 * UserReminderPreferencesClientDTO dual bodies retired.
 * Sole *ResponseSchema + z.infer (semantic ClientDTO is z.infer alias).
 */
describe('preference/calendar client dto duals retired (residual 829)', () => {
  const notifApi = __dirname;
  const scheduleApi = resolve(notifApi, '../../schedule/api');
  const reminderApi = resolve(notifApi, '../../reminder/api');
  const notifAgg = resolve(notifApi, '../aggregates/notification-preference-client.ts');
  const scheduleAgg = resolve(notifApi, '../../schedule/aggregates/calendar-entry-client.ts');
  const reminderAgg = resolve(
    notifApi,
    '../../reminder/aggregates/user-reminder-preferences-server.ts',
  );

  it('owns NotificationPreferenceClientDTO as z.infer of NotificationPreferenceResponseSchema', () => {
    const aggregate = readFileSync(notifAgg, 'utf8');
    const schemas = readFileSync(resolve(notifApi, 'response-schemas.ts'), 'utf8');
    const routes = readFileSync(
      resolve(notifApi, '../../../../../notification/src/api/routes.ts'),
      'utf8',
    );
    expect(aggregate).toContain('Residual 829');
    expect(aggregate).toContain(
      'export type NotificationPreferenceClientDTO = z.infer<typeof NotificationPreferenceResponseSchema>',
    );
    expect(aggregate).not.toMatch(/export interface NotificationPreferenceClientDTO\b/);
    expect(schemas).toContain('Residual 829');
    expect(schemas).toContain(
      'export const NotificationPreferenceResponseSchema = z.object({',
    );
    expect(routes).toContain(
      "successResponse(NotificationPreferenceResponseSchema, '获取成功')",
    );
  });

  it('owns CalendarEntryClientDTO as z.infer of CalendarEntryResponseSchema', () => {
    const aggregate = readFileSync(scheduleAgg, 'utf8');
    const schemas = readFileSync(resolve(scheduleApi, 'response-schemas.ts'), 'utf8');
    const routes = readFileSync(
      resolve(scheduleApi, '../../../../../schedule/src/api/schedule-event.routes.ts'),
      'utf8',
    );
    expect(aggregate).toContain('Residual 829');
    expect(aggregate).toContain(
      'export type CalendarEntryClientDTO = z.infer<typeof CalendarEntryResponseSchema>',
    );
    expect(aggregate).not.toMatch(/export interface CalendarEntryClientDTO\b/);
    expect(schemas).toContain('Residual 829');
    expect(schemas).toContain('export const CalendarEntryResponseSchema = z.object({');
    expect(routes).toContain('CalendarEntryResponseSchema');
    expect(routes).toContain(
      "successResponse(z.array(CalendarEntryResponseSchema), '获取成功')",
    );
  });

  it('owns UserReminderPreferencesClientDTO as z.infer of UserReminderPreferencesResponseSchema', () => {
    const aggregate = readFileSync(reminderAgg, 'utf8');
    const schemas = readFileSync(resolve(reminderApi, 'response-schemas.ts'), 'utf8');
    const routes = readFileSync(
      resolve(reminderApi, '../../../../../reminder/src/api/routes/reminder-preferences.routes.ts'),
      'utf8',
    );
    expect(aggregate).toContain('Residual 829');
    expect(aggregate).toContain(
      'export type UserReminderPreferencesClientDTO = z.infer<typeof UserReminderPreferencesResponseSchema>',
    );
    expect(aggregate).not.toMatch(/export interface UserReminderPreferencesClientDTO\b/);
    expect(aggregate).toMatch(/export interface UserReminderPreferencesServerDTO\b/);
    expect(schemas).toContain('Residual 829');
    expect(schemas).toContain(
      'export const UserReminderPreferencesResponseSchema = z.object({',
    );
    expect(routes).toContain(
      "successResponse(UserReminderPreferencesResponseSchema, '获取成功')",
    );
  });
});
