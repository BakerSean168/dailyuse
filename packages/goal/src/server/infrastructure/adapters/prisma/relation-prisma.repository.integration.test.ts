import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { IdentityId } from '@memoflow/domain-shared';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../../__tests__/integration-helpers';
import type { PrismaClient } from '@memoflow/database';
import { RelationPrismaRepository } from './relation-prisma.repository';
import type { SubjectRef } from '../../../../domain';

async function seedIdentity(): Promise<string> {
  const identityId = IdentityId.generate();
  await seedAccount({ id: identityId });
  return identityId;
}

describe('RelationPrismaRepository integration (R5)', () => {
  let db: PrismaClient;
  let repository: RelationPrismaRepository;

  afterAll(async () => {
    await cleanAll();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanAll();
    db = await getPrisma();
    repository = new RelationPrismaRepository(db);
  });

  it('creates a relation and returns a DTO with epoch-ms createdAt', async () => {
    const identityId = await seedIdentity();

    const dto = await repository.create({
      identityId,
      subject: { type: 'note', id: 'note-1' },
      relationType: 'references',
      object: { type: 'goal', id: 'goal-1' },
    });

    expect(dto.id).toBeTruthy();
    expect(dto.subject).toEqual({ type: 'note', id: 'note-1' });
    expect(dto.relationType).toBe('references');
    expect(dto.object).toEqual({ type: 'goal', id: 'goal-1' });
    expect(typeof dto.createdAt).toBe('number');
  });

  it('scopes forward/reverse lookups by identityId', async () => {
    const identityId = await seedIdentity();
    const otherIdentityId = await seedIdentity();

    await repository.create({
      identityId,
      subject: { type: 'note', id: 'note-1' },
      relationType: 'references',
      object: { type: 'goal', id: 'goal-1' },
    });
    await repository.create({
      identityId: otherIdentityId,
      subject: { type: 'note', id: 'note-1' },
      relationType: 'references',
      object: { type: 'goal', id: 'goal-1' },
    });

    const forward = await repository.findBySubject(identityId, { type: 'note', id: 'note-1' });
    const reverse = await repository.findByObject(identityId, { type: 'goal', id: 'goal-1' });

    expect(forward).toHaveLength(1);
    expect(reverse).toHaveLength(1);
    expect(reverse[0]?.subject).toEqual({ type: 'note', id: 'note-1' });
  });

  it('orders findBySubject results by createdAt ASC', async () => {
    const identityId = await seedIdentity();
    const subject: SubjectRef = { type: 'task', id: 'task-1' };

    await db.relation.create({
      data: {
        id: 'rel-2',
        identityId,
        subjectType: 'task',
        subjectId: 'task-1',
        relationType: 'related',
        objectType: 'goal',
        objectId: 'goal-2',
        createdAt: new Date(2_000),
      },
    });
    await db.relation.create({
      data: {
        id: 'rel-1',
        identityId,
        subjectType: 'task',
        subjectId: 'task-1',
        relationType: 'references',
        objectType: 'goal',
        objectId: 'goal-1',
        createdAt: new Date(1_000),
      },
    });

    const dtos = await repository.findBySubject(identityId, subject);

    expect(dtos.map((d) => d.id)).toEqual(['rel-1', 'rel-2']);
  });

  it('throws a unique-constraint error when the same relation already exists', async () => {
    const identityId = await seedIdentity();
    const input = {
      identityId,
      subject: { type: 'goal', id: 'goal-1' },
      relationType: 'contributes_to',
      object: { type: 'goal', id: 'goal-2' },
    };

    await repository.create(input);

    await expect(repository.create(input)).rejects.toThrow(/Unique/i);
  });

  it('deletes only the identity-owned relation row', async () => {
    const identityId = await seedIdentity();
    const otherIdentityId = await seedIdentity();

    const mine = await repository.create({
      identityId,
      subject: { type: 'note', id: 'note-1' },
      relationType: 'references',
      object: { type: 'goal', id: 'goal-1' },
    });
    await repository.create({
      identityId: otherIdentityId,
      subject: { type: 'note', id: 'note-1' },
      relationType: 'references',
      object: { type: 'goal', id: 'goal-1' },
    });

    await repository.deleteByIdentityId(identityId, mine.id);

    expect(await db.relation.count({ where: { identityId } })).toBe(0);
    expect(await db.relation.count({ where: { identityId: otherIdentityId } })).toBe(1);
  });
});
