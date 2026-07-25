import { describe, it, expect, vi } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRecordRepository } from '@/server/domain';
import { DeleteGoalRecordUseCase } from '../delete-goal-record.use-case';

describe('DeleteGoalRecordUseCase', () => {
  it('deletes owned record via findByIdForIdentity', async () => {
    const record = { id: 'record-1', identityId: 'identity-1' } as any;
    const repo = createMockRepo<IGoalRecordRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(record),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalRecordUseCase(repo);

    const result = await useCase.execute('record-1', 'identity-1');

    expect(result.ok).toBe(true);
    expect(repo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'record-1');
    expect(repo.delete).toHaveBeenCalledWith('identity-1', 'record-1');
  });

  it('returns NOT_FOUND when record is missing or foreign', async () => {
    const repo = createMockRepo<IGoalRecordRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    });
    const useCase = new DeleteGoalRecordUseCase(repo);

    const result = await useCase.execute('record-1', 'identity-other');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
