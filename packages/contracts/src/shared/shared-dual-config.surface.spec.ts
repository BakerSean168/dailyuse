import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Residual 645: shared dual config VOs + ZodErrorResponse dual retired.
 * Cross-module levels remain; module configs stay under modules/*.
 */
const here = dirname(fileURLToPath(import.meta.url));

describe('shared dual config / ZodErrorResponse retired (residual 645)', () => {
  it('value-objects barrel only exports Importance/Urgency/Priority levels', () => {
    const index = readFileSync(join(here, 'value-objects/index.ts'), 'utf8');
    expect(index).toContain('Residual 645');
    expect(index).toContain('ImportanceLevel');
    expect(index).toContain('UrgencyLevel');
    expect(index).toContain('PriorityLevel');
    expect(index).not.toContain('ReminderConfig');
    expect(index).not.toContain('NotificationConfig');
    expect(index).not.toContain('ScheduleConfig');
    expect(index).not.toContain('NotifyChannel');
  });

  it('dead dual config source files stay deleted', () => {
    const vo = join(here, 'value-objects');
    for (const name of [
      'reminder-config.ts',
      'notification-config.ts',
      'schedule-config.ts',
      'notify-channel.ts',
    ]) {
      expect(existsSync(join(vo, name))).toBe(false);
    }
    const names = readdirSync(vo).filter((n) => n.endsWith('.ts') && !n.endsWith('.spec.ts'));
    expect(names.sort()).toEqual(
      ['importance.ts', 'index.ts', 'priority.ts', 'urgency.ts'].sort(),
    );
  });

  it('shared.ts keeps ClientInfo/UserAgreement and drops dual error/pagination schemas', () => {
    const source = readFileSync(join(here, 'shared.ts'), 'utf8');
    expect(source).toContain('Residual 645');
    expect(source).toContain('export type ClientInfo');
    expect(source).toContain('export type UserAgreement');
    expect(source).not.toMatch(/export const ZodErrorResponse/);
    expect(source).not.toMatch(/export type ZodErrorResponse/);
    expect(source).not.toMatch(/export const PaginationQuery/);
    expect(source).not.toMatch(/export const Paginated\b/);
  });
});
