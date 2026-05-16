import { describe, expect, it } from 'vitest';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { __test__ } from './resourceReferenceIndex';

function createResource(overrides: Partial<ResourceClientDTO> = {}): ResourceClientDTO {
  return {
    id: 'resource-1' as ResourceClientDTO['id'],
    repositoryId: 'repo-1' as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: 'note.md',
    type: 'File',
    mimeType: 'text/markdown',
    path: '/notes/note.md',
    size: 10,
    content: '![Diagram](/images/diagram.png)',
    metadata: { tags: [], wordCount: null, readingTime: null, thumbnail: null },
    stats: { viewCount: 0, editCount: 0, linkCount: 0, lastViewedAt: null, lastEditedAt: null },
    status: 'Active',
    createdAt: 0,
    updatedAt: 10,
    deletedAt: null,
    version: 1,
    isDeleted: false,
    isArchived: false,
    isActive: true,
    isDraft: false,
    extension: '.md',
    icon: 'file',
    ...overrides,
  };
}

describe('resourceReferenceIndex', () => {
  it('builds inbound and unresolved reference lookups', () => {
    const note = createResource();
    const image = createResource({
      id: 'image-1' as ResourceClientDTO['id'],
      name: 'diagram.png',
      mimeType: 'image/png',
      extension: '.png',
      path: '/images/diagram.png',
      content: 'ZmFrZQ==',
    });
    const broken = createResource({
      id: 'note-2' as ResourceClientDTO['id'],
      name: 'broken.md',
      path: '/notes/broken.md',
      content: '![Missing](/images/missing.png)',
    });

    const index = __test__.buildResourceReferenceIndex([note, image, broken]);

    expect(index.getInboundReferences('image-1')).toHaveLength(1);
    expect(index.getUnresolvedReferences()).toHaveLength(1);
    expect(index.getDeleteImpact('image-1').notes[0]?.title).toBe('note');
  });

  it('repairs a broken reference using targeted rewrite spans', () => {
    const markdown = 'before ![Missing](/images/missing.png) after';
    const reference = indexFirstReference(markdown);

    const repaired = __test__.repairBrokenMarkdownReference({
      markdown,
      reference,
      replacement: { path: '/images/fixed.png' },
    });

    expect(repaired).toBe('before ![Missing](/images/fixed.png) after');
  });

  it('tracks broken link references for non-image repository paths', () => {
    const note = createResource({
      id: 'note-3' as ResourceClientDTO['id'],
      name: 'links.md',
      path: '/notes/links.md',
      content: '[Spec](/docs/missing.pdf)',
    });

    const index = __test__.buildResourceReferenceIndex([note]);

    expect(index.getUnresolvedReferences('note-3')).toHaveLength(1);
    expect(index.getUnresolvedReferences('note-3')[0]?.reference.kind).toBe('link');
  });
});

function indexFirstReference(markdown: string) {
  const index = __test__.buildResourceReferenceIndex([
    createResource({ id: 'note-fix' as ResourceClientDTO['id'], content: markdown }),
  ]);

  const references = index.getNoteReferences('note-fix');
  if (references.length === 0) {
    throw new Error('Expected a parsed reference.');
  }

  return references[0]!;
}
