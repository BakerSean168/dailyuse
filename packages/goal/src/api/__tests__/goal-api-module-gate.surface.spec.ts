import { describe, expect, it } from 'vitest';

describe('GoalApiModule composition fail-closed gate (W4 P2-1)', () => {
  it('createGoalApiModule requires the Task binding port (type-level + runtime)', async () => {
    const { createGoalApiModule } = await import('../module');
    expect(() =>
      (createGoalApiModule as unknown as (o?: unknown) => unknown)(),
    ).toThrow();
  });

  it('createGoalPrismaModule fails closed without taskBindingReadPort', async () => {
    const { createGoalPrismaModule } = await import('../../server/infrastructure/prisma');
    const db = {};
    expect(() => createGoalPrismaModule(db as never)).toThrow(/taskBindingReadPort/);
  });
});
