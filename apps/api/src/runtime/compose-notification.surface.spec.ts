import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Notification API runtime composer surface.
 * 通知 API runtime composer 表面契约。
 *
 * Locks the Step C wiring: apps/api/src/main.ts must compose notification
 * through the runtime composer, must no longer reference the retired
 * `createNotificationApiModule` transport factory or the
 * `@memoflow/notification/api` seam, and must take the schedule notification
 * port from the composer instead of building a second Prisma repository set.
 * The composer must only touch the narrow seams the plan allows.
 *
 * 锁定 Step C 接线：apps/api/src/main.ts 必须通过 runtime composer 组装通知，
 * 不再引用已退役的 `createNotificationApiModule` transport 工厂或
 * `@memoflow/notification/api` seam，并从 composer 获取 schedule notification
 * port（而不是构造第二套 Prisma 仓储集合）。composer 只允许接触计划允许的窄 seam。
 */
describe('notification API runtime composer surface', () => {
  const dir = resolve(__dirname, '..');
  const main = readFileSync(resolve(dir, 'main.ts'), 'utf8');
  const composer = readFileSync(resolve(dir, 'runtime/compose-notification.ts'), 'utf8');

  it('main.ts composes notification via composeNotification({ db: prisma, closureChecker, channelCapabilities })', () => {
    expect(main).toContain("from './runtime/compose-notification'");
    expect(main).toMatch(/composeNotification\(\{\s*db: prisma,\s*closureChecker: accountActiveChecker,\s*channelCapabilities:/);
    expect(main).toContain('.register(notificationApiModule.module)');
  });

  it('main.ts no longer references createNotificationApiModule or the notification/api seam', () => {
    expect(main).not.toMatch(/\bcreateNotificationApiModule\b/);
    expect(main).not.toContain("from '@memoflow/notification/api'");
  });

  it('main.ts takes the schedule notification port from the composer (no second Prisma set)', () => {
    expect(main).not.toContain('createNotificationPrismaScheduleNotificationPort');
    expect(main).not.toContain("from '@memoflow/notification/schedule-execution'");
    expect(main).toContain('notificationApiModule.scheduleNotificationPort');
  });

  it('composer only touches the narrow seams (no deep server import)', () => {
    expect(composer).toContain('interface ComposeNotificationDependencies');
    expect(composer).toContain("from '@memoflow/notification'");
    expect(composer).toContain("from '@memoflow/notification/api'");
    expect(composer).not.toMatch(/@memoflow\/notification\/server/);
  });
});
