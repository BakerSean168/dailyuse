import { defineComponent, h, onMounted } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskTemplateViewModel } from '../types';
import TaskTemplateDialog from './TaskTemplateDialog.vue';

const loadGoals = vi.fn().mockResolvedValue([]);
const loadKeyResults = vi.fn().mockResolvedValue([]);

vi.mock('../../composables/useTaskGoalBindingOptions', () => ({
  useTaskGoalBindingOptions: () => ({
    goals: { value: [{ id: 'goal-a', title: 'Goal A' }] },
    keyResultsByGoal: { value: {} },
    loadingKeyResults: { value: {} },
    keyResultErrorsByGoal: { value: {} },
    loadGoals,
    loadKeyResults,
  }),
}));

const TaskTemplateFormStub = defineComponent({
  name: 'TaskTemplateForm',
  props: ['modelValue', 'onRequestKeyResults'],
  emits: ['update:modelValue', 'update:validation', 'close'],
  setup(props) {
    onMounted(() => {
      const goalId = (props.modelValue as TaskTemplateViewModel)?.goalBinding?.goalId;
      if (goalId) void props.onRequestKeyResults(goalId);
    });
    return () => h('div', { 'data-testid': 'task-form-stub' });
  },
});

const passThrough = (name: string, tag = 'div') =>
  defineComponent({
    name,
    setup(_props, { slots, attrs }) {
      return () => h(tag, attrs, slots.default?.());
    },
  });

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      task: {
        templateDialog: {
          editTitle: 'Edit task plan',
          createTitle: 'Create task plan',
          editSubtitle: 'Edit',
          createSubtitle: 'Create',
          cancel: 'Cancel',
          saveChanges: 'Save',
          create: 'Create',
        },
      },
    },
  },
});

function editTemplate(): TaskTemplateViewModel {
  return {
    id: 'template-a',
    title: 'Linked task',
    status: 'ACTIVE',
    timeConfig: { timeType: 'AllDay' },
    goalBinding: {
      goalId: 'goal-a',
      keyResultId: 'kr-a',
      incrementValue: 1,
      progressTrigger: 'PER_INSTANCE',
    },
  };
}

describe('TaskTemplateDialog goal binding loading ownership', () => {
  beforeEach(() => {
    loadGoals.mockClear();
    loadKeyResults.mockClear();
  });

  it('lets the goal binding section issue the single edit-mode KR request', async () => {
    mount(TaskTemplateDialog, {
      props: { modelValue: true, mode: 'edit', template: editTemplate() },
      global: {
        plugins: [i18n],
        stubs: {
          TaskTemplateForm: TaskTemplateFormStub,
          DependencyManager: true,
          Dialog: passThrough('Dialog'),
          DialogContent: passThrough('DialogContent'),
          DialogHeader: passThrough('DialogHeader'),
          DialogTitle: passThrough('DialogTitle'),
          DialogDescription: passThrough('DialogDescription'),
          DialogFooter: passThrough('DialogFooter'),
          Button: passThrough('Button', 'button'),
          Pencil: true,
          PlusCircle: true,
        },
      },
    });
    await flushPromises();

    expect(loadGoals).toHaveBeenCalledTimes(1);
    expect(loadKeyResults).toHaveBeenCalledTimes(1);
    expect(loadKeyResults).toHaveBeenCalledWith('goal-a', false);
  });
});
