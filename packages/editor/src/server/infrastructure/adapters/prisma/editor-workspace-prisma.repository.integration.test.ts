import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ProjectType } from '@dailyuse/contracts/editor';
import { EditorWorkspace } from '../../../domain/aggregates/editor-workspace';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../../__tests__/integration-helpers';
import { EditorWorkspacePrismaRepository } from './editor-workspace-prisma.repository';

describe('EditorWorkspacePrismaRepository integration', () => {
  beforeEach(async () => {
    await cleanAll();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('atomically creates one natural-key workspace and returns its persisted id to every caller', async () => {
    const identityId = await seedAccount();
    const prisma = await getPrisma();
    const repository = new EditorWorkspacePrismaRepository(prisma);
    const projectPath = '/repositories/editor-create-or-get';
    const candidates = Array.from({ length: 12 }, (_, index) =>
      EditorWorkspace.create({
        identityId,
        name: `Concurrent candidate ${index}`,
        projectPath,
        projectType: ProjectType.Other,
        createDefaultSession: false,
      }),
    );

    const results = await Promise.all(
      candidates.map((candidate) => repository.createOrGet(candidate)),
    );
    const persistedRows = await prisma.editorWorkspace.findMany({
      where: { identityId, projectPath },
    });

    expect(persistedRows).toHaveLength(1);
    expect(new Set(results.map((workspace) => workspace.id))).toEqual(
      new Set([persistedRows[0]?.id]),
    );
    expect(results.every((workspace) => workspace.identityId === identityId)).toBe(true);
    expect(results.every((workspace) => workspace.projectPath === projectPath)).toBe(true);
  });
});
