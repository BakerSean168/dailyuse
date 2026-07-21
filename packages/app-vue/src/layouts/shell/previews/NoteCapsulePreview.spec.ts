/** @vitest-environment happy-dom */

import { computed, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NoteCapsulePreview from './NoteCapsulePreview.vue';

const notesRef = ref<
  Array<{ id: string; title: string; path: string; updatedAt: number; source: 'projection' | 'local-vault' }>
>([]);
const errorRef = ref<string | null>(null);
const isLoadingRef = ref(false);
const load = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../modules/repository/composables/useRecentKnowledgeNotes', () => ({
  useRecentKnowledgeNotes: () => ({
    notes: notesRef,
    error: errorRef,
    isLoading: isLoadingRef,
    load,
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: { capsule: { note: 'Note' } },
      shell: {
        enterModule: 'Enter',
        preview: { noteEmpty: 'No notes', noteResource: 'Note' },
      },
      common: { retry: 'Retry', operationFailed: 'failed' },
    },
  },
});

function mountPreview() {
  return mount(NoteCapsulePreview, { global: { plugins: [i18n] } });
}

describe('NoteCapsulePreview', () => {
  afterEach(() => {
    notesRef.value = [];
    errorRef.value = null;
    isLoadingRef.value = false;
    vi.clearAllMocks();
  });

  it('loads recent knowledge notes and emits view-all', async () => {
    notesRef.value = [
      { id: 'n1', title: 'Alpha', path: 'a.md', updatedAt: 200, source: 'projection' },
      { id: 'n2', title: 'Beta', path: 'b.md', updatedAt: 100, source: 'projection' },
    ];
    const wrapper = mountPreview();
    await flushPromises();
    expect(load).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="note-capsule-item-n1"]').exists()).toBe(true);
    await wrapper.get('[data-testid="note-capsule-view-all"]').trigger('click');
    expect(wrapper.emitted('view-all')).toBeTruthy();
    wrapper.unmount();
  });

  it('shows empty state', async () => {
    const wrapper = mountPreview();
    await flushPromises();
    expect(wrapper.find('[data-testid="note-capsule-empty"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
