import { describe, expect, it, vi } from 'vitest'
import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron'
import { PowerSyncLabelRepository } from '../infrastructure/powersync/powersync-label.repository'

function createDb(options: { foreignLabel?: boolean } = {}) {
  const executed: Array<{ sql: string; parameters?: unknown[] }> = []
  const tx: IElectronDatabaseTransaction = {
    execute: vi.fn(async (sql: string, parameters?: unknown[]) => {
      executed.push({ sql, parameters })
      return { rowsAffected: 1 }
    }),
    getAll: vi.fn(async () => []) as unknown as IElectronDatabaseTransaction['getAll'],
    get: vi.fn(async () => { throw new Error('not used') }) as IElectronDatabaseTransaction['get'],
    getOptional: vi.fn(async (sql: string, parameters?: unknown[]) => {
      if (sql.includes('FROM goals')) return { id: parameters?.[0] }
      if (sql.includes('FROM task_templates')) return { id: parameters?.[0] }
      if (sql.includes('FROM labels')) {
        return options.foreignLabel ? null : { id: parameters?.[0] }
      }
      return null
    }) as unknown as IElectronDatabaseTransaction['getOptional'],
  }
  const db = {
    ...tx,
    writeTransaction: vi.fn(async <T>(work: (transaction: IElectronDatabaseTransaction) => Promise<T>) => work(tx)),
  } as unknown as IElectronDatabase
  return { db, tx, executed }
}

describe('PowerSyncLabelRepository', () => {
  it('replaces Goal labels inside one write transaction with identity-scoped validation', async () => {
    const { db, tx, executed } = createDb()
    const repository = new PowerSyncLabelRepository(db)

    await repository.replaceGoalLabels('identity-1', 'goal-1', ['label-1', 'label-2'])

    expect(db.writeTransaction).toHaveBeenCalledOnce()
    expect(tx.getOptional).toHaveBeenCalledWith(
      expect.stringContaining('FROM goals'),
      ['goal-1', 'identity-1'],
    )
    expect(executed.some(({ sql }) => sql.includes('DELETE FROM goal_labels'))).toBe(true)
    expect(executed.filter(({ sql }) => sql.includes('INSERT INTO goal_labels'))).toHaveLength(2)
  })

  it('rejects a foreign label before replacing existing assignments', async () => {
    const { db, executed } = createDb({ foreignLabel: true })
    const repository = new PowerSyncLabelRepository(db)

    await expect(
      repository.replaceTaskLabels('identity-1', 'task-1', ['foreign-label']),
    ).rejects.toThrow('do not belong to the identity')

    expect(executed.some(({ sql }) => sql.includes('DELETE FROM task_labels'))).toBe(false)
  })
})
