import { DOMWrapper, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../../locales/en-US';
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
  messages: { 'en-US': enUS },
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

  it('keeps date labels visible and gives the date controls stable accessible names', async () => {
    const wrapper = mount(GoalDialog, {
      props: { open: true },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    const startDate = document.querySelector<HTMLElement>('[data-testid="goal-start-date"]');
    const targetDate = document.querySelector<HTMLElement>('[data-testid="goal-target-date"]');
    expect(startDate?.getAttribute('aria-label')).toBe('Start date');
    expect(targetDate?.getAttribute('aria-label')).toBe('Target date');
    expect(document.body.textContent).toContain('Start date');
    expect(document.body.textContent).toContain('Target date');

    wrapper.unmount();
  });

  it('creates the first basic key result inline with user-facing type and impact labels', async () => {
    const wrapper = mount(GoalDialog, {
      props: { open: true },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    const keyResultsTab = new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="goal-dialog-key-results-tab"]')!,
    );
    await keyResultsTab.trigger('keydown', { key: 'Enter', code: 'Enter' });
    await keyResultsTab.trigger('keyup', { key: 'Enter', code: 'Enter' });
    await nextTick();

    const title = document.querySelector<HTMLInputElement>('[data-testid="inline-kr-title"]');
    expect(title).not.toBeNull();
    await new DOMWrapper(title!).setValue('Reach 50 active teams');
    await new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="inline-kr-add"]')!,
    ).trigger('click');
    await nextTick();

    const dialogText = document.querySelector('[data-testid="goal-dialog"]')?.textContent ?? '';
    expect(dialogText).toContain('Reach 50 active teams');
    expect(dialogText).toContain('Cumulative value');
    expect(dialogText).toContain('Medium impact');
    expect(dialogText).not.toContain('Incremental');

    wrapper.unmount();
  });
});
