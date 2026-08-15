import { describe, expect, it } from 'vitest';
import type { Relation as PrismaRelation } from '@memoflow/database';
import { PrismaRelationMapper } from './prisma-relation.mapper';

describe('PrismaRelationMapper', () => {
  it('maps persisted string enums to frozen unions and createdAt to epoch ms', () => {
    const row = {
      id: 'rel-1',
      identityId: 'identity-1',
      subjectType: 'note',
      subjectId: 'note-1',
      relationType: 'depends_on',
      objectType: 'goal',
      objectId: 'goal-1',
      createdAt: new Date(1_700_000_000_000),
      updatedAt: new Date(1_700_000_000_001),
    } as PrismaRelation;

    const dto = PrismaRelationMapper.toDTO(row);

    expect(dto.id).toBe('rel-1');
    expect(dto.subject).toEqual({ type: 'note', id: 'note-1' });
    expect(dto.relationType).toBe('depends_on');
    expect(dto.object).toEqual({ type: 'goal', id: 'goal-1' });
    expect(dto.createdAt).toBe(1_700_000_000_000);
  });

  it('maps lists and preserves ordering', () => {
    const rows = [
      {
        id: 'rel-1',
        identityId: 'identity-1',
        subjectType: 'task',
        subjectId: 'task-1',
        relationType: 'references',
        objectType: 'goal',
        objectId: 'goal-1',
        createdAt: new Date(1_000),
        updatedAt: new Date(1_001),
      },
      {
        id: 'rel-2',
        identityId: 'identity-1',
        subjectType: 'habit',
        subjectId: 'habit-1',
        relationType: 'contributes_to',
        objectType: 'goal',
        objectId: 'goal-2',
        createdAt: new Date(2_000),
        updatedAt: new Date(2_001),
      },
    ] as PrismaRelation[];

    const dtos = PrismaRelationMapper.toDTOList(rows);

    expect(dtos).toHaveLength(2);
    expect(dtos[0]).toMatchObject({ id: 'rel-1', relationType: 'references' });
    expect(dtos[1]).toMatchObject({ id: 'rel-2', subject: { type: 'habit', id: 'habit-1' } });
  });
});
