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

describe('PowerSyncTaskInstanceRepository occurrence identity (TASK-2204)', () => {
  it('skips insert when the same identity/template occurrence key already exists', async () => {
    const getOptional = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing-instance' });
    const execute = vi.fn();
    const repository = new PowerSyncTaskInstanceRepository({
      getOptional,
      execute,
    } as unknown as IElectronDatabaseTransaction);
    const instance = {
      occurrenceKey: 'tpl-1:2026-03-08',
      toServerDTO: () => ({
        id: 'new-instance',
        templateId: 'tpl-1',
        identityId: 'identity-a',
        instanceDate: Date.UTC(2026, 2, 8),
        status: 'Pending',
        importance: 'Moderate',
        timeConfig: { timeType: 'AllDay', startDate: Date.UTC(2026, 2, 8), timePoint: null, timeRange: null },
        actualStartTime: null,
        actualEndTime: null,
        comment: null,
        version: 1,
        createdAt: Date.UTC(2026, 2, 8),
        updatedAt: Date.UTC(2026, 2, 8),
        deletedAt: null,
      }),
      domainEvents: [],
      pullDomainEvents: () => [],
    } as any;

    await repository.save(instance);

    expect(getOptional).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('template_id = ? AND identity_id = ? AND occurrence_key = ?'),
      ['tpl-1', 'identity-a', 'tpl-1:2026-03-08'],
    );
    expect(execute).not.toHaveBeenCalled();
  });
});
