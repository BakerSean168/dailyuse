import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Reminder API runtime composer surface.
 * 提醒 API runtime composer 表面契约。
 *
 * Locks the Step C wiring: apps/api/src/main.ts must compose reminder through
 * the runtime composer, must no longer reference the retired
 * `createReminderApiModule` transport factory or the `@memoflow/reminder/api`
 * seam, and must take the reminder schedule sources from the composer instead of
 * building a second Prisma repository set. The composer must only touch the
 * narrow seams the plan allows.
 *
 * 锁定 Step C 接线：apps/api/src/main.ts 必须通过 runtime composer 组装提醒，
 * 不再引用已退役的 `createReminderApiModule` transport 工厂或
 * `@memoflow/reminder/api` seam，并从 composer 获取提醒 schedule sources
 * （而不是构造第二套 Prisma 仓储集合）。composer 只允许接触计划允许的窄 seam。
 */
describe('reminder API runtime composer surface', () => {
  const dir = resolve(__dirname, '..');
  const main = readFileSync(resolve(dir, 'main.ts'), 'utf8');
  const composer = readFileSync(resolve(dir, 'runtime/compose-reminder.ts'), 'utf8');

  it('main.ts composes reminder via composeReminder({ db: prisma, closureChecker })', () => {
    expect(main).toContain("from './runtime/compose-reminder'");
    expect(main).toMatch(/composeReminder\(\{\s*db: prisma,\s*closureChecker: accountActiveChecker,?\s*\}/);
    expect(main).toContain('.register(reminderApiModule.module)');
  });

  it('main.ts no longer references createReminderApiModule or the reminder/api seam', () => {
    expect(main).not.toMatch(/\bcreateReminderApiModule\b/);
    expect(main).not.toContain("from '@memoflow/reminder/api'");
  });

  it('main.ts takes the reminder schedule sources from the composer (no second Prisma set)', () => {
    expect(main).not.toMatch(/createReminderPrismaSchedule(Execution|Projection)Source/);
    expect(main).not.toContain("from '@memoflow/reminder/schedule-execution'");
    expect(main).not.toContain("from '@memoflow/reminder/schedule-projection'");
    expect(main).toContain('reminderApiModule.scheduleExecutionSource');
    expect(main).toContain('reminderApiModule.scheduleProjectionSource');
  });

  it('composer only touches the narrow seams (no deep server import)', () => {
    expect(composer).toContain('interface ComposeReminderDependencies');
    expect(composer).toContain("from '@memoflow/reminder'");
    expect(composer).toContain("from '@memoflow/reminder/api'");
    expect(composer).not.toMatch(/@memoflow\/reminder\/server/);
  });
});
