/** @vitest-environment jsdom */
import { computed, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskCapsulePreview from './TaskCapsulePreview.vue';

const instancesRef = ref<Record<string, unknown>[]>([]);
const templatesRef = ref<Record<string, unknown>[]>([]);
const errorRef = ref<string | null>(null);
const fetchInstancesByDateRange = vi.fn().mockResolvedValue(undefined);
const fetchTemplates = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../modules/task/composables/useTask', () => ({
  useTask: () => ({
    instances: computed(() => instancesRef.value),
    templates: computed(() => templatesRef.value),
    error: computed(() => errorRef.value),
    fetchInstancesByDateRange,
    fetchTemplates,
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: { capsule: { task: 'Task' } },
      shell: {
        enterModule: 'Enter',
        preview: { taskEmpty: 'No tasks', taskAllDone: 'All done', allDay: 'All day' },
      },
      common: { retry: 'Retry', operationFailed: 'failed' },
    },
  },
});

function mountPreview() {
  return mount(TaskCapsulePreview, { global: { plugins: [i18n] } });
}

describe('TaskCapsulePreview', () => {
  afterEach(() => {
    instancesRef.value = [];
    templatesRef.value = [];
    errorRef.value = null;
    vi.clearAllMocks();
  });

  it('loads today instances and resolves titles from templates', async () => {
    const today = Date.now();
    templatesRef.value = [{ id: 'tpl-1', name: 'Write tests' }];
    instancesRef.value = [
      {
        id: 'i1',
        templateId: 'tpl-1',
        instanceDate: today,
        status: 'Pending',
        timeConfig: { timePoint: 9 * 60 },
      },
    ];
    const wrapper = mountPreview();
    await flushPromises();
    expect(fetchInstancesByDateRange).toHaveBeenCalled();
    expect(fetchTemplates).toHaveBeenCalled();
    expect(wrapper.get('[data-testid="task-capsule-item-i1"]').text()).toContain('Write tests');
    expect(wrapper.get('[data-testid="task-capsule-item-i1"]').text()).toContain('09:00');
    wrapper.unmount();
  });

  it('shows empty state when no instances today', async () => {
    const wrapper = mountPreview();
    await flushPromises();
    expect(wrapper.find('[data-testid="task-capsule-empty"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
