import { describe, expect, it, vi } from 'vitest';
import {
  GOAL_RECORD_SOURCE_CORRELATION_INDEX,
  prepareGoalRecordSourceCorrelation,
  type GoalRecordSchemaQueryClient,
} from './goal-record-source-correlation';

function result(rows: Array<Record<string, unknown>>) {
  return { rows, rowCount: rows.length };
}

describe('prepareGoalRecordSourceCorrelation', () => {
  it('leaves a fresh database for Prisma to initialize', async () => {
    const query = vi.fn().mockResolvedValue(result([{ regclass: null }]));

    const report = await prepareGoalRecordSourceCorrelation({
      query,
    } as GoalRecordSchemaQueryClient);

    expect(report).toEqual({ tablePresent: false, indexPresent: false, indexCreated: false });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('adds nullable source columns before checking existing source keys', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(result([{ regclass: 'goal_records' }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(
        result([
          {
            identity_id: 'identity-1',
            source_type: 'task',
            source_id: 'task-1',
            duplicate_count: 2,
          },
        ]),
      );

    await expect(
      prepareGoalRecordSourceCorrelation({ query } as GoalRecordSchemaQueryClient),
    ).rejects.toThrow(/duplicate source rows exist/);
    expect(String(query.mock.calls[1]?.[0])).toContain('ADD COLUMN IF NOT EXISTS source_type');
    expect(query.mock.calls.some(([sql]) => String(sql).includes('CREATE UNIQUE INDEX'))).toBe(
      false,
    );
  });

  it('creates and verifies the source correlation index idempotently', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(result([{ regclass: 'goal_records' }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{ regclass: null }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{ regclass: GOAL_RECORD_SOURCE_CORRELATION_INDEX }]));

    const report = await prepareGoalRecordSourceCorrelation({
      query,
    } as GoalRecordSchemaQueryClient);

    expect(report).toEqual({ tablePresent: true, indexPresent: true, indexCreated: true });
    expect(
      query.mock.calls.some(
        ([sql]) =>
          String(sql).includes('CREATE UNIQUE INDEX IF NOT EXISTS') &&
          String(sql).includes('(identity_id, source_type, source_id)'),
      ),
    ).toBe(true);
  });
});
