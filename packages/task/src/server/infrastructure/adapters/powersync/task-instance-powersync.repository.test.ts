import { describe, expect, it, vi } from 'vitest';
import type { IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import { PowerSyncTaskInstanceRepository } from './task-instance-powersync.repository';

describe('PowerSyncTaskInstanceRepository template statistics', () => {
  it('maps the same rolling due window and future Pending projection as Prisma', async () => {
    const getAll = vi.fn().mockResolvedValue([
      {
        templateId: 'template-a',
        instanceCount: 4,
        completedInstanceCount: 2,
        pendingInstanceCount: 2,
        dueInstanceCount: 2,
        completedDueInstanceCount: 1,
        futurePendingInstanceCount: 1,
        singleInstanceStatus: null,
      },
    ]);
    const repository = new PowerSyncTaskInstanceRepository({
      getAll,
    } as unknown as IElectronDatabaseTransaction);
    const asOf = Date.UTC(2026, 6, 30, 12);

    const result = await repository.getTemplateStats(
      ['template-a', 'template-without-instances'],
      'identity-a',
      asOf,
    );

    expect(result['template-a']).toEqual({
      templateId: 'template-a',
      instanceCount: 4,
      completedInstanceCount: 2,
      pendingInstanceCount: 2,
      dueInstanceCount: 2,
      completedDueInstanceCount: 1,
      completionWindowDays: 30,
      futurePendingInstanceCount: 1,
      singleInstanceStatus: null,
      completionRate: 50,
    });
    expect(result['template-without-instances']).toEqual({
      templateId: 'template-without-instances',
      instanceCount: 0,
      completedInstanceCount: 0,
      pendingInstanceCount: 0,
      dueInstanceCount: 0,
      completedDueInstanceCount: 0,
      completionWindowDays: 30,
      futurePendingInstanceCount: 0,
      singleInstanceStatus: null,
      completionRate: 0,
    });

    const [sql, params] = getAll.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('instance_date >= ?');
    expect(sql).toContain('instance_date <= ?');
    expect(sql).toContain("status = 'Pending' AND instance_date > ?");
    expect(params).toEqual([
      new Date(asOf - 30 * 24 * 60 * 60 * 1000).toISOString(),
      new Date(asOf).toISOString(),
      new Date(asOf - 30 * 24 * 60 * 60 * 1000).toISOString(),
      new Date(asOf).toISOString(),
      new Date(asOf).toISOString(),
      'template-a',
      'template-without-instances',
      'identity-a',
    ]);
  });
});
