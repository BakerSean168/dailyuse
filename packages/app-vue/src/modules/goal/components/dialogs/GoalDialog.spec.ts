import { DOMWrapper, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../../locales/en-US';
import GoalDialog from './GoalDialog.vue';
import { clearDialogDrafts } from '../../../../layouts/shell/dialog-draft-store';

const goalActions = vi.hoisted(() => ({
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  addKeyResult: vi.fn(),
}));

vi.mock('../../composables/useGoal', async () => {
  const { ref } = await import('vue');
  return {
    useGoal: () => ({
      createGoal: goalActions.createGoal,
      updateGoal: goalActions.updateGoal,
      goals: ref([]),
      goalFolders: ref([]),
      isSaving: ref(false),
      fetchKeyResults: vi.fn(),
      addKeyResult: goalActions.addKeyResult,
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
    goalActions.createGoal.mockReset();
    goalActions.updateGoal.mockReset();
    goalActions.addKeyResult.mockReset();
    clearDialogDrafts();
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

  it('restores a dirty draft after the routed panel subtree is rebuilt', async () => {
    const first = mount(GoalDialog, {
      props: { open: true },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    await new DOMWrapper(
      document.querySelector<HTMLInputElement>('[data-testid="goal-name-input"]')!,
    ).setValue('Survives boundary retry');
    await nextTick();
    first.unmount();

    const rebuilt = mount(GoalDialog, {
      props: { open: true },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    expect(document.querySelector<HTMLInputElement>('[data-testid="goal-name-input"]')?.value).toBe(
      'Survives boundary retry',
    );
    rebuilt.unmount();
  });

  it('keeps the dialog and all entered fields when the aggregate command fails', async () => {
    goalActions.createGoal.mockResolvedValue(null);
    const wrapper = mount(GoalDialog, {
      props: { open: true },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    const name = new DOMWrapper(
      document.querySelector<HTMLInputElement>('[data-testid="goal-name-input"]')!,
    );
    await name.setValue('Retry without losing me');
    await new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="save-goal-button"]')!,
    ).trigger('click');
    await nextTick();

    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(document.querySelector<HTMLInputElement>('[data-testid="goal-name-input"]')?.value).toBe(
      'Retry without losing me',
    );
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

  it('persists a filled inline key result when the user creates the goal without adding it separately', async () => {
    goalActions.createGoal.mockResolvedValue({ id: 'goal-1' });
    goalActions.addKeyResult.mockResolvedValue({ id: 'kr-1' });

    const wrapper = mount(GoalDialog, {
      props: { open: true },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    await new DOMWrapper(
      document.querySelector<HTMLInputElement>('[data-testid="goal-name-input"]')!,
    ).setValue('Launch community');

    const keyResultsTab = new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="goal-dialog-key-results-tab"]')!,
    );
    await keyResultsTab.trigger('keydown', { key: 'Enter', code: 'Enter' });
    await keyResultsTab.trigger('keyup', { key: 'Enter', code: 'Enter' });
    await nextTick();

    await new DOMWrapper(
      document.querySelector<HTMLInputElement>('[data-testid="inline-kr-title"]')!,
    ).setValue('Reach 50 active teams');

    await new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="save-goal-button"]')!,
    ).trigger('click');
    await nextTick();

    expect(goalActions.createGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Launch community',
        initialKeyResults: [expect.objectContaining({ title: 'Reach 50 active teams' })],
      }),
    );
    expect(goalActions.addKeyResult).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('submits an edited goal and its complete KR state through one aggregate command', async () => {
    goalActions.updateGoal.mockResolvedValue({ id: 'goal-1' });
    const now = Date.now();
    const goal = {
      id: 'goal-1',
      name: 'Existing goal',
      description: null,
      category: null,
      importance: 'Moderate',
      color: null,
      feasibilityAnalysis: null,
      motivation: null,
      tags: [],
      startDate: null,
      targetDate: null,
      folderId: null,
      parentGoalId: null,
      reminderConfig: null,
      version: 4,
      keyResults: [
        {
          id: 'kr-1',
          title: 'Existing KR',
          description: null,
          progress: {
            valueType: 'Incremental',
            aggregationMethod: 'Sum',
            initialValue: 0,
            currentValue: 2,
            targetValue: 10,
            unit: null,
          },
          weight: 3,
          order: 0,
          version: 1,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ],
    };
    const wrapper = mount(GoalDialog, {
      props: { open: true, mode: 'edit', goal: goal as never },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    await new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="save-goal-button"]')!,
    ).trigger('click');
    await nextTick();

    expect(goalActions.updateGoal).toHaveBeenCalledTimes(1);
    expect(goalActions.updateGoal).toHaveBeenCalledWith(
      'goal-1',
      expect.objectContaining({
        expectedVersion: 4,
        keyResults: [expect.objectContaining({ id: 'kr-1', title: 'Existing KR' })],
      }),
    );
    expect(goalActions.addKeyResult).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
