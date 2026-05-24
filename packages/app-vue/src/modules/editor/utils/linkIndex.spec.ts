import { describe, expect, it } from 'vitest';
import {
  buildEditorLinkIndex,
  getBacklinksForNote,
  getLinkGraphForNote,
  searchLinkIndexNotes,
} from './link-index';
import { ResourceStatus } from '@dailyuse/contracts/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { RepositoryId, ResourceId } from '@dailyuse/contracts/primitives';

function asResourceId(value: string): ResourceId {
  return value as ResourceId;
}

function asRepositoryId(value: string): RepositoryId {
  return value as RepositoryId;
}

function createResource(overrides: Partial<ResourceClientDTO>): ResourceClientDTO {
  return {
    id: overrides.id ?? asResourceId('resource-1'),
    repositoryId: overrides.repositoryId ?? asRepositoryId('repo-1'),
    folderId: overrides.folderId ?? null,
    name: overrides.name ?? 'Untitled.md',
    type: overrides.type ?? 'File',
    mimeType: overrides.mimeType ?? 'text/markdown',
    path: overrides.path ?? `/${overrides.name ?? 'Untitled.md'}`,
    size: overrides.size ?? 0,
    content: overrides.content ?? '',
    metadata: overrides.metadata ?? {
      tags: [],
      wordCount: null,
      readingTime: null,
      thumbnail: null,
    },
    stats: overrides.stats ?? {
      viewCount: 0,
      editCount: 0,
      linkCount: 0,
      lastViewedAt: null,
      lastEditedAt: null,
    },
    status: overrides.status ?? ResourceStatus.Active,
    createdAt: overrides.createdAt ?? 1710028800000,
    updatedAt: overrides.updatedAt ?? 1710028800000,
    deletedAt: overrides.deletedAt ?? null,
    version: overrides.version ?? 1,
    isDeleted: overrides.isDeleted ?? false,
    isArchived: overrides.isArchived ?? false,
    isActive: overrides.isActive ?? true,
    isDraft: overrides.isDraft ?? false,
    extension: overrides.extension ?? '.md',
    icon: overrides.icon ?? 'mdi:file-document-outline',
  };
}

describe('linkIndex', () => {
  it('resolves suggestions and backlinks from the same index', () => {
    const resources = [
      createResource({
        id: asResourceId('alpha'),
        name: 'Alpha.md',
        path: '/notes/Alpha.md',
        metadata: { tags: ['knowledge'], wordCount: 10, readingTime: 1, thumbnail: null },
        content: 'Reference to [[Beta]] and [[Missing Note]].',
      }),
      createResource({
        id: asResourceId('beta'),
        name: 'Beta.md',
        path: '/notes/Beta.md',
        content: 'Backlink to [[Alpha|the alpha note]].',
      }),
      createResource({
        id: asResourceId('gamma'),
        name: 'Gamma.md',
        path: '/archive/Gamma.md',
        content: '',
      }),
    ];

    const index = buildEditorLinkIndex(resources);

    expect(searchLinkIndexNotes(index, 'bet')[0]?.id).toBe('beta');

    const backlinks = getBacklinksForNote(index, 'alpha');
    expect(backlinks).toHaveLength(1);
    expect(backlinks[0]?.sourceNote.id).toBe('beta');

    expect(index.unresolvedLinks).toHaveLength(1);
    expect(index.unresolvedLinks[0]?.target).toBe('Missing Note');
  });

  it('limits graph traversal and keeps the center node', () => {
    const resources = [
      createResource({
        id: asResourceId('alpha'),
        name: 'Alpha.md',
        path: '/Alpha.md',
        content: '[[Beta]] [[Gamma]]',
      }),
      createResource({
        id: asResourceId('beta'),
        name: 'Beta.md',
        path: '/Beta.md',
        content: '[[Delta]]',
      }),
      createResource({
        id: asResourceId('gamma'),
        name: 'Gamma.md',
        path: '/Gamma.md',
        content: '[[Delta]]',
      }),
      createResource({
        id: asResourceId('delta'),
        name: 'Delta.md',
        path: '/Delta.md',
        content: '[[Epsilon]]',
      }),
      createResource({
        id: asResourceId('epsilon'),
        name: 'Epsilon.md',
        path: '/Epsilon.md',
        content: '',
      }),
    ];

    const index = buildEditorLinkIndex(resources);
    const graph = getLinkGraphForNote(index, 'alpha', 2, { maxNodes: 4, maxEdges: 4 });

    expect(graph.centerId).toBe('alpha');
    expect(graph.nodes.some((node) => node.id === 'alpha' && node.isCurrent)).toBe(true);
    expect(graph.nodes.length).toBeLessThanOrEqual(4);
    expect(graph.edges.length).toBeLessThanOrEqual(4);
  });
});
