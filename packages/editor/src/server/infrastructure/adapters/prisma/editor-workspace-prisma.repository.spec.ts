import { describe, expect, it, vi } from 'vitest';
import type { EditorWorkspace as PrismaEditorWorkspace, PrismaClient } from '@dailyuse/database';
import { ProjectType } from '@dailyuse/contracts/editor';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { EditorWorkspaceId } from '../../../domain/value-objects/editor-workspace-id';
import { EditorWorkspace } from '../../../domain/aggregates/editor-workspace';
import { EditorWorkspacePrismaRepository } from './editor-workspace-prisma.repository';

function createPersistedRow(
  identityId: string,
  projectPath: string,
): PrismaEditorWorkspace {
  const now = new Date('2026-07-15T12:00:00.000Z');
  return {
    id: EditorWorkspaceId.generate(),
    identityId,
    name: 'Persisted workspace',
    description: null,
    projectPath,
    projectType: ProjectType.Other,
    layout: {},
    setting: {},
    isActive: true,
    version: 1,
    createdAt: now,
    updatedAt: now,
    accessedAt: now,
    deletedAt: null,
  };
}

describe('EditorWorkspacePrismaRepository.createOrGet', () => {
  it('upserts by identity and project path and returns the actual persisted row', async () => {
    const identityId = IdentityId.generate();
    const projectPath = 'repository-1';
    const persistedRow = createPersistedRow(identityId, projectPath);
    const upsert = vi.fn().mockResolvedValue(persistedRow);
    const repository = new EditorWorkspacePrismaRepository({
      editorWorkspace: { upsert },
    } as unknown as PrismaClient);
    const candidates = Array.from({ length: 8 }, (_, index) =>
      EditorWorkspace.create({
        identityId,
        name: `Candidate ${index}`,
        projectPath,
        projectType: ProjectType.Other,
      }),
    );

    const results = await Promise.all(
      candidates.map((candidate) => repository.createOrGet(candidate)),
    );

    expect(new Set(results.map((workspace) => workspace.id))).toEqual(
      new Set([persistedRow.id]),
    );
    expect(results.every((workspace) => workspace.id !== candidates[0]?.id)).toBe(true);
    for (const [call] of upsert.mock.calls) {
      expect(call).toEqual(
        expect.objectContaining({
          where: {
            identityId_projectPath: { identityId, projectPath },
          },
          update: { deletedAt: null },
        }),
      );
    }
  });
});
