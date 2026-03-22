/** @vitest-environment jsdom */

import { computed } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

const readResourceAsDataUrl = vi.fn(async () => 'data:image/png;base64,ZmFrZQ==');

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../repository/services/repositoryResourceGateway', () => ({
  useRepositoryResourceGateway: () => ({
    ensureReady: vi.fn(async () => undefined),
    resources: computed(() => [
      {
        id: 'image-1',
        repositoryId: 'repo-1',
        folderId: null,
        name: 'diagram.png',
        displayName: 'diagram',
        type: 'File',
        mimeType: 'image/png',
        path: '/images/diagram.png',
        size: 128,
        content: null,
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
        statusText: 'Active',
        typeText: 'File',
        formattedSize: '128 B',
        createdAtText: 'today',
        updatedAtText: 'today',
        extension: '.png',
        icon: 'file-image',
      },
    ]),
    readResourceAsDataUrl,
  }),
}));

import EditorPreview from './EditorPreview.vue';

describe('EditorPreview', () => {
  it('renders repository image references with a readable data url', async () => {
    const wrapper = mount(EditorPreview, {
      props: {
        content: '![Diagram](/images/diagram.png)',
      },
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    const image = wrapper.element.querySelector('img');
    expect(readResourceAsDataUrl).toHaveBeenCalledTimes(1);
    expect(image?.getAttribute('src')).toBe('data:image/png;base64,ZmFrZQ==');
  });
});
