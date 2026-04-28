import { describe, it, expect } from 'vitest';
import { PrismaGoalRecordMapper } from './prisma-goal-record-mapper';

describe('PrismaGoalRecordMapper', () => {
  it('maps prisma row to domain goal record with defaults', () => {
    const row = {
      id: 'record-1',
      keyResultId: 'kr-1',
      identityId: 'identity-1',
      value: 42,
      note: null,
      recordedAt: new Date(1_500),
      version: undefined,
      createdAt: new Date(1_000),
      updatedAt: new Date(2_000),
      deletedAt: null,
    } as any;

    const domain = PrismaGoalRecordMapper.toDomain(row);
    const dto = domain.toServerDTO();

    expect(dto.id).toBe('record-1');
    expect(dto.keyResultId).toBe('kr-1');
    expect(dto.note).toBeNull();
    expect(dto.version).toBe(1);
    expect(dto.recordedAt).toBe(1_500);
  });

  it('maps list and keeps nullable fields', () => {
    const rows = [
      {
        id: 'record-2',
        keyResultId: 'kr-2',
        identityId: 'identity-1',
        value: 8,
        note: 'good',
        recordedAt: new Date(2_500),
        version: 2,
        createdAt: new Date(2_000),
        updatedAt: new Date(3_000),
        deletedAt: new Date(4_000),
      },
    ] as any[];

    const domains = PrismaGoalRecordMapper.toDomainList(rows);
    const dto = domains[0].toServerDTO();

    expect(domains).toHaveLength(1);
    expect(dto.note).toBe('good');
    expect(dto.deletedAt).toBe(4_000);
    expect(dto.version).toBe(2);
  });
});
