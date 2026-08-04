import { DOMWrapper, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../../locales/en-US';
import GoalRecordDialog from './GoalRecordDialog.vue';

const goalActions = vi.hoisted(() => ({
  createGoalRecord: vi.fn(),
}));

vi.mock('../../composables/useGoal', () => {
  return {
    useGoal: () => ({
      createGoalRecord: goalActions.createGoalRecord,
      getKeyResultById: (id: string) =>
        id === 'kr-1' ? { id: 'kr-1', progress: { unit: 'tasks' } } : undefined,
    }),
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: { 'en-US': enUS },
});

async function openDialog() {
  const wrapper = mount(GoalRecordDialog, {
    attachTo: document.body,
    global: { plugins: [i18n] },
  });
  wrapper.vm.openDialog('goal-1', 'kr-1');
  await nextTick();
  return wrapper;
}

describe('GoalRecordDialog submission lifecycle', () => {
  afterEach(() => {
    goalActions.createGoalRecord.mockReset();
    document.body.innerHTML = '';
  });

  it('keeps the dialog and draft open while the record is pending and when it fails', async () => {
    let resolveCreate!: (value: null) => void;
    goalActions.createGoalRecord.mockReturnValue(
      new Promise<null>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const wrapper = await openDialog();

    const amount = document.querySelector<HTMLInputElement>('#change-amount')!;
    const note = document.querySelector<HTMLTextAreaElement>('#record-note')!;
    await new DOMWrapper(amount).setValue('5');
    await new DOMWrapper(note).setValue('Still important');
    await new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="save-goal-record"]')!,
    ).trigger('click');
    await nextTick();

    expect(document.querySelector('#change-amount')).not.toBeNull();
    expect(
      document.querySelector<HTMLButtonElement>('[data-testid="save-goal-record"]')?.disabled,
    ).toBe(true);

    resolveCreate(null);
    await nextTick();
    await nextTick();

    expect(document.querySelector<HTMLInputElement>('#change-amount')?.value).toBe('5');
    expect(document.querySelector<HTMLTextAreaElement>('#record-note')?.value).toBe(
      'Still important',
    );
    expect(document.querySelector('[role="alert"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('closes only after a successful record creation', async () => {
    goalActions.createGoalRecord.mockResolvedValue({ id: 'record-1' });
    const wrapper = await openDialog();

    await new DOMWrapper(document.querySelector<HTMLInputElement>('#change-amount')!).setValue('2');
    await new DOMWrapper(
      document.querySelector<HTMLElement>('[data-testid="save-goal-record"]')!,
    ).trigger('click');
    await nextTick();
    await nextTick();

    expect(goalActions.createGoalRecord).toHaveBeenCalledOnce();
    expect(document.querySelector('#change-amount')).toBeNull();
    wrapper.unmount();
  });

  it('renders quick values as keyboard-operable buttons', async () => {
    const wrapper = await openDialog();
    const quickValue = document.querySelector<HTMLButtonElement>(
      '[data-testid="quick-goal-record-5"]',
    );

    expect(quickValue?.tagName).toBe('BUTTON');
    expect(quickValue?.type).toBe('button');
    await new DOMWrapper(quickValue!).trigger('click');
    expect(document.querySelector<HTMLInputElement>('#change-amount')?.value).toBe('5');
    wrapper.unmount();
  });
});
