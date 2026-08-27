/** @vitest-environment happy-dom */

import { DOMWrapper, flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { productionLocaleMessages } from '../../../../locales/production-messages';
import { LabelPicker } from '../../../../shared/components';
import GoalDialog from './GoalDialog.vue';

const mocks = vi.hoisted(() => ({
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  createLabel: vi.fn(),
}));

vi.mock('../../composables/useGoal', async () => {
  const { ref } = await import('vue');
  return {
    useGoal: () => ({
      createGoal: mocks.createGoal,
      updateGoal: mocks.updateGoal,
      isSaving: ref(false),
    }),
  };
});

vi.mock('../../../../shared/composables/useLabelCatalog', async () => {
  const { ref } = await import('vue');
  return {
    useLabelCatalog: () => ({
      options: ref([
        { id: 'label-existing', name: 'Existing', color: null },
        { id: 'label-work', name: 'Work', color: '#3366ff' },
      ]),
      isLoading: ref(false),
      createLabel: mocks.createLabel,
    }),
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: productionLocaleMessages,
});

function dom(testId: string): DOMWrapper<Element> {
  const element = document.querySelector(`[data-testid="${testId}"]`);
  if (!element) throw new Error(`Missing DOM element ${testId}`);
  return new DOMWrapper(element);
}

describe('GoalDialog vNext surface (GOAL-5101)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('edits only vNext Direction + Measurement fields without retired taxonomy or motivation forms', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../dialogs/GoalDialog.vue'), 'utf8');
    expect(source).toContain('dueDate');
    expect(source).toContain('LabelPicker');
    expect(source).toContain('initialKeyResults');
    expect(source).toContain('keyResults');
    expect(source).toContain('ProductDialogShell');
    for (const retired of [
      'targetDate',
      'folderId',
      'parentGoalId',
      'category',
      'importance',
      'draft.motivation',
      'draft.feasibilityAnalysis',
    ]) {
      expect(source).not.toContain(retired);
    }
  });

  it('creates a label and submits labels plus locally drafted KRs in one Goal aggregate command', async () => {
    mocks.createLabel.mockResolvedValue({
      id: 'label-work',
      name: 'Work',
      color: '#3366ff',
      normalizedName: 'work',
      createdAt: 1,
      updatedAt: 1,
    });
    mocks.createGoal.mockResolvedValue({ id: 'goal-created', name: 'Ship MemoFlow vNext' });

    const wrapper = mount(GoalDialog, {
      props: { open: true, mode: 'create' },
      attachTo: document.body,
      global: { plugins: [i18n] },
    });
    await nextTick();

    await dom('goal-name-input').setValue('Ship MemoFlow vNext');
    wrapper.getComponent(LabelPicker).vm.$emit('create', 'Work');
    await flushPromises();

    await dom('add-key-result-entry').trigger('click');
    await nextTick();
    await dom('draft-kr-title-input').setValue('Reach 50 active users');
    await dom('draft-kr-current-input').setValue('40');
    await dom('draft-kr-target-input').setValue('50');
    await dom('draft-kr-unit-input').setValue('users');
    await dom('save-key-result-draft').trigger('click');
    await nextTick();
    await dom('save-goal-button').trigger('click');
    await flushPromises();

    expect(mocks.createLabel).toHaveBeenCalledWith('Work');
    expect(mocks.createGoal).toHaveBeenCalledOnce();
    expect(mocks.createGoal).toHaveBeenCalledWith({
      name: 'Ship MemoFlow vNext',
      description: undefined,
      startDate: undefined,
      dueDate: undefined,
      labelIds: ['label-work'],
      initialKeyResults: [
        {
          title: 'Reach 50 active users',
          description: null,
          calculationMethod: 'Sum',
          startingValue: 40,
          currentValue: 40,
          targetValue: 50,
          progressBaselineValue: null,
          unit: 'users',
          weight: 3,
        },
      ],
    });
    expect(mocks.updateGoal).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
