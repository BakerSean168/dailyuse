/** @vitest-environment jsdom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import ImageResourcePickerDialog from './ImageResourcePickerDialog.vue';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

function createResource(overrides: Partial<ResourceClientDTO> = {}): ResourceClientDTO {
  return {
    id: 'resource-1' as ResourceClientDTO['id'],
    repositoryId: 'repo-1' as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: 'diagram.png',
    type: 'File',
    mimeType: 'image/png',
    path: '/images/diagram.png',
    size: 10,
    content: '',
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
    statusText: 'Active',
    typeText: 'File',
    displayName: 'Diagram',
    formattedSize: '10 B',
    createdAtText: 'today',
    updatedAtText: 'today',
    extension: '.png',
    icon: 'file-image',
    ...overrides,
  };
}

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      editor: {
        resourcePicker: {
          title: 'Insert image from repository',
          description: 'Choose an existing repository image to insert at the cursor.',
          searchPlaceholder: 'Search images...',
          empty: 'No images in this repository yet',
          noMatches: 'No images match your search',
        },
      },
    },
  },
});

describe('ImageResourcePickerDialog', () => {
  it('renders image resources and emits the selected resource', async () => {
    const wrapper = mount(ImageResourcePickerDialog, {
      props: {
        open: true,
        resources: [createResource()],
      },
      attachTo: document.body,
      global: {
        plugins: [i18n],
      },
    });

    await nextTick();

    expect(document.body.textContent).toContain('Diagram');

    const button = Array.from(document.body.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes('Diagram'),
    );
    expect(button).toBeDefined();

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'resource-1' });
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
  });
});
