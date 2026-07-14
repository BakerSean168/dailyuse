/** @vitest-environment jsdom */
import { computed, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NoteCapsulePreview from './NoteCapsulePreview.vue';

const resourcesRef = ref<Record<string, unknown>[]>([]);
const errorRef = ref<string | null>(null);
const initRepository = vi.fn().mockResolvedValue(undefined);
const fetchResources = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../modules/repository/composables/useRepository', () => ({
  useRepository: () => ({
    resources: computed(() => resourcesRef.value),
    error: computed(() => errorRef.value),
    initRepository,
    fetchResources,
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
    resourcesRef.value = [];
    errorRef.value = null;
    vi.clearAllMocks();
  });

  it('loads recent resources and emits view-all', async () => {
    resourcesRef.value = [
      { id: 'n1', name: 'Alpha', type: 'markdown', updatedAt: 200 },
      { id: 'n2', title: 'Beta', type: 'doc', updatedAt: 100 },
    ];
    const wrapper = mountPreview();
    await flushPromises();
    expect(initRepository).toHaveBeenCalled();
    expect(fetchResources).toHaveBeenCalled();
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
