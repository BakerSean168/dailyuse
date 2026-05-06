import { describe, expect, it } from 'vitest';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { __test__ } from './markdownResourceReferences';

function createResource(overrides: Partial<ResourceClientDTO> = {}): ResourceClientDTO {
  return {
    id: 'resource-1' as ResourceClientDTO['id'],
    repositoryId: 'repo-1' as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: 'diagram.png',
    type: 'File',
    mimeType: 'image/png',
    path: '/images/diagram 1.png',
    size: 10,
    content: 'ZmFrZQ==',
    metadata: { tags: [], wordCount: null, readingTime: null, thumbnail: null },
    stats: { viewCount: 0, editCount: 0, linkCount: 0, lastViewedAt: null, lastEditedAt: null },
    status: 'Active',
    createdAt: 0,
    updatedAt: 0,
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

describe('markdownResourceReferences', () => {
  it('parses repository image and link references', () => {
    const references = __test__.parseMarkdownResourceReferences(
      '![Diagram](/images/diagram%201.png)\n[Doc](/docs/spec.pdf)',
    );

    expect(references).toHaveLength(2);
    expect(references[0]?.normalizedPath).toBe('/images/diagram 1.png');
    expect(references[1]?.kind).toBe('link');
  });

  it('resolves repository references against current resources', () => {
    const resolved = __test__.resolveMarkdownResourceReferences(
      '![Diagram](/images/diagram%201.png)',
      [createResource()],
    );

    expect(resolved[0]?.resourceId).toBe('resource-1');
    expect(resolved[0]?.isBroken).toBe(false);
  });

  it('rewrites targeted references without mutating other links', () => {
    const [reference] = __test__.parseMarkdownResourceReferences(
      '![Diagram](/images/diagram%201.png)',
    );
    const next = __test__.rewriteMarkdownResourceReference(
      '![Diagram](/images/diagram%201.png)',
      reference!,
      { destination: 'data:image/png;base64,ZmFrZQ==' },
    );

    expect(next).toBe('![Diagram](data:image/png;base64,ZmFrZQ==)');
  });
});
