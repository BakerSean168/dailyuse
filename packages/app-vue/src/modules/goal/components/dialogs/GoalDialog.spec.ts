import { DOMWrapper, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GoalDialog from './GoalDialog.vue';

vi.mock('../../composables/useGoal', async () => {
  const { ref } = await import('vue');
  return {
    useGoal: () => ({
      createGoal: vi.fn(),
      updateGoal: vi.fn(),
      goals: ref([]),
      goalFolders: ref([]),
      isSaving: ref(false),
      fetchKeyResults: vi.fn(),
      addKeyResult: vi.fn(),
      updateKeyResult: vi.fn(),
      deleteKeyResult: vi.fn(),
      keyResults: ref([]),
    }),
  };
});

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: { 'en-US': {} },
});

describe('GoalDialog draft lifecycle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('captures a baseline and reports edits when initially mounted open from a deep link', async () => {
    const wrapper = mount(GoalDialog, {
      props: { open: true },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    expect(wrapper.emitted('dirty-change')?.at(-1)).toEqual([false]);

    const input = document.querySelector<HTMLInputElement>('[data-testid="goal-name-input"]');
    expect(input).not.toBeNull();
    await new DOMWrapper(input!).setValue('Deep-link draft');
    await nextTick();

    expect(wrapper.emitted('dirty-change')?.at(-1)).toEqual([true]);
    wrapper.unmount();
  });
});
