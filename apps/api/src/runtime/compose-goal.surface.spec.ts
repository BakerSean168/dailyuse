import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Goal API runtime composer surface.
 * 目标 API runtime composer 表面契约。
 *
 * Locks the Step 3 wiring: apps/api/src/main.ts must compose goal through the
 * runtime composer and must no longer reference the retired
 * `createGoalApiModule` transport factory or the `@memoflow/goal/api` seam.
 * The composer must only touch the narrow seams the plan allows.
 *
 * 锁定 Step 3 接线：apps/api/src/main.ts 必须通过 runtime composer 组装目标，
 * 且不再引用已退役的 `createGoalApiModule` transport 工厂或 `@memoflow/goal/api`
 * seam。composer 只允许接触计划允许的窄 seam。
 */
describe('goal API runtime composer surface', () => {
  const dir = resolve(__dirname, '..');
  const main = readFileSync(resolve(dir, 'main.ts'), 'utf8');
  const composer = readFileSync(resolve(dir, 'runtime/compose-goal.ts'), 'utf8');

  it('main.ts composes goal via composeGoal({ db: prisma, taskBindingReadPort: new PrismaTaskBindingReadPort(prisma) })', () => {
    expect(main).toContain("from './runtime/compose-goal'");
    expect(main).toMatch(
      /composeGoal\(\{\s*db: prisma,\s*taskBindingReadPort: new PrismaTaskBindingReadPort\(prisma\),?\s*\}/,
    );
    expect(main).toContain('.register(goalComposed.module)');
  });

  it('main.ts no longer references createGoalApiModule or the goal/api seam', () => {
    expect(main).not.toMatch(/\bcreateGoalApiModule\b/);
    expect(main).not.toContain("from '@memoflow/goal/api'");
  });

  it('composer only touches the narrow seams (no CloudAuth, no storage base dir, no deep server import)', () => {
    expect(composer).toContain('interface ComposeGoalDependencies');
    expect(composer).toContain("from '@memoflow/goal'");
    expect(composer).toContain("from '@memoflow/goal/api'");
    expect(composer).not.toContain('CloudAuth');
    expect(composer).not.toContain('repositoryStorageBaseDir');
    expect(composer).not.toMatch(/@memoflow\/goal\/server/);
  });
});
