import { computed } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { __test__ } from './useResourceInsertion';

function createResource(overrides: Partial<ResourceClientDTO> = {}): ResourceClientDTO {
  return {
    id: 'resource-1' as ResourceClientDTO['id'],
    repositoryId: 'repo-1' as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: 'meeting-notes.png',
    type: 'File',
    mimeType: 'image/png',
    path: '/images/meeting-notes.png',
    size: 128,
    content: 'ZmFrZQ==',
    metadata: { tags: [], wordCount: null, readingTime: null, thumbnail: null },
    stats: { viewCount: 0, editCount: 0, linkCount: 0, lastViewedAt: null, lastEditedAt: null },
    status: 'Active',
    createdAt: 1741564800000,
    updatedAt: 1741564800000,
    deletedAt: null,
    version: 1,
    isDeleted: false,
    isArchived: false,
    isActive: true,
    isDraft: false,
    extension: '.png',
    icon: 'file-image',
    ...overrides,
  };
}

describe('useResourceInsertion helpers', () => {
  it('falls back to image when alt text is empty after normalization', () => {
    expect(__test__.deriveImageAltText(createResource({ name: '.png' }))).toBe(
      'image',
    );
  });

  it('builds deterministic pasted image file names from note title and timestamp', () => {
    const fileName = __test__.buildPastedImageFileName({
      noteName: 'Meeting Notes.md',
      originalName: 'Screenshot.PNG',
      index: 1,
      now: new Date(2026, 2, 11, 9, 8, 7),
    });

    expect(fileName).toBe('meeting-notes-2026-03-11-090807-02.png');
  });

  it('classifies insertion kinds from repository resources', () => {
    expect(__test__.classifyResourceInsertionKind(createResource())).toBe('image');
    expect(
      __test__.classifyResourceInsertionKind(
        createResource({ mimeType: 'text/markdown', extension: '.md', name: 'doc.md' }),
      ),
    ).toBe('note');
  });

  it('builds path markdown references from repository path values', () => {
    expect(__test__.buildPathMarkdownReference(createResource(), 'image')).toBe(
      '![meeting-notes](/images/meeting-notes.png)',
    );
  });

  it('builds base64 markdown references for explicit image insertion', async () => {
    const result = await __test__.buildResourceMarkdown(createResource(), {
      mode: 'base64',
      template: 'image',
      readResourceAsDataUrl: async () => 'data:image/png;base64,ZmFrZQ==',
    });

    expect(result).toBe('![meeting-notes](data:image/png;base64,ZmFrZQ==)');
  });
});

describe('useResourceInsertion orchestration', () => {
  it('uploads pasted images and inserts backend path references at the captured selection', async () => {
    const inserted: Array<{ text: string; selection?: { from: number; to: number } }> = [];
    const uploadResources = vi.fn(async (files: File[]) => ({
      successes: files.map((file, index) =>
        createResource({
          id: `image-${index + 1}` as ResourceClientDTO['id'],
          name: file.name,
          path: `/images/${file.name}`,
        }),
      ),
      failures: [],
    }));

    const insertion = __test__.createResourceInsertion({
      resources: computed(() => []),
      uploadResources,
      readResourceAsDataUrl: async () => 'data:image/png;base64,ZmFrZQ==',
    });

    const result = await insertion.insertUploadedImages({
      files: [new File(['a'], 'clipboard.png', { type: 'image/png' })],
      currentNoteName: 'Project Plan.md',
      selection: { from: 5, to: 5 },
      now: new Date(2026, 2, 11, 9, 8, 7),
      insertText: (text, selection) => {
        inserted.push({ text, selection });
      },
    });

    expect(uploadResources).toHaveBeenCalledTimes(1);
    expect(uploadResources.mock.calls[0]?.[0][0].name).toBe(
      'project-plan-2026-03-11-090807-01.png',
    );
    expect(inserted).toEqual([
      {
        text: '![project-plan-2026-03-11-090807-01](/images/project-plan-2026-03-11-090807-01.png)',
        selection: { from: 5, to: 5 },
      },
    ]);
    expect(result.insertedResources).toHaveLength(1);
  });
});
