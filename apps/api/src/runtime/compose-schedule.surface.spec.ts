import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Schedule API runtime composer surface.
 * 日程 API runtime composer 表面契约。
 *
 * Locks the Step C two-phase wiring: apps/api/src/main.ts must create the
 * schedule repository set ONCE, feed its scheduleTaskRepository into
 * createScheduleOrchestrationModule, and hand the SAME set plus the
 * orchestration sourceExecutor to composeSchedule. main.ts must no longer
 * reference the retired `createScheduleApiModule` transport factory or the
 * `@memoflow/schedule/api` seam, and must not create a second schedule
 * repository set. The composer must only touch the narrow seams the plan allows.
 *
 * 锁定 Step C 两阶段接线：apps/api/src/main.ts 必须恰好创建一次 schedule 仓储集合，
 * 把其 scheduleTaskRepository 喂给 createScheduleOrchestrationModule，并把同一集合
 * 与编排 sourceExecutor 交给 composeSchedule。main.ts 不再引用已退役的
 * `createScheduleApiModule` transport 工厂或 `@memoflow/schedule/api` seam，
 * 也不得创建第二套 schedule 仓储集合。composer 只允许接触计划允许的窄 seam。
 */
describe('schedule API runtime composer surface', () => {
  const dir = resolve(__dirname, '..');
  const main = readFileSync(resolve(dir, 'main.ts'), 'utf8');
  const composer = readFileSync(resolve(dir, 'runtime/compose-schedule.ts'), 'utf8');

  it('main.ts composes schedule via composeSchedule({ repositories, sourceExecutor })', () => {
    expect(main).toContain("from './runtime/compose-schedule'");
    expect(main).toMatch(/composeSchedule\(\{\s*repositories: scheduleRepositorySet,\s*sourceExecutor: scheduleOrchestrationModule\.sourceExecutor,?\s*\}/);
    expect(main).toContain('.register(scheduleApiModule.module)');
  });

  it('main.ts creates the schedule repository set exactly once and shares it with orchestration', () => {
    const matches = main.match(/createSchedulePrismaRepositories\(prisma/g) ?? [];
    expect(matches.length).toBe(1);
    expect(main).toContain('scheduleRepositorySet.scheduleTaskRepository');
  });

  it('main.ts no longer references createScheduleApiModule or the schedule/api seam', () => {
    expect(main).not.toMatch(/\bcreateScheduleApiModule\b/);
    expect(main).not.toContain("from '@memoflow/schedule/api'");
  });

  it('main.ts no longer creates a standalone schedule task repository for orchestration', () => {
    expect(main).not.toMatch(/\bcreateScheduleTaskPrismaRepository\b/);
  });

  it('main.ts restores the durable PrismaOutboxWriter on the schedule task repository (merge-base R1-2)', () => {
    expect(main).toMatch(/createSchedulePrismaRepositories\(\s*prisma,\s*\{\s*outboxWriter: new PrismaOutboxWriter\(prisma\),?\s*\}\)/);
    expect(main).toContain("import { PrismaOutboxWriter } from './outbox/prisma-outbox-writer'");
  });

  it('composer only touches the narrow seams (no deep server import)', () => {
    expect(composer).toContain('interface ComposeScheduleDependencies');
    expect(composer).toContain("from '@memoflow/schedule'");
    expect(composer).toContain("from '@memoflow/schedule/api'");
    expect(composer).not.toMatch(/@memoflow\/schedule\/server/);
  });
});
