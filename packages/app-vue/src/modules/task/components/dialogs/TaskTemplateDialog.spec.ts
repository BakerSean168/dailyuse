import { defineComponent, h, onMounted, reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskTemplateViewModel } from '../types';
import TaskTemplateDialog from './TaskTemplateDialog.vue';
import { clearDialogDrafts } from '../../../../layouts/shell/dialog-draft-store';

afterEach(() => clearDialogDrafts());

const loadGoals = vi.fn().mockResolvedValue([]);
const loadKeyResults = vi.fn().mockResolvedValue([]);
const clearErrors = vi.fn();

vi.mock('../../composables/useTaskGoalBindingOptions', () => ({
  useTaskGoalBindingOptions: () => ({
    goals: { value: [{ id: 'goal-a', title: 'Goal A' }] },
    keyResultsByGoal: { value: {} },
    loadingKeyResults: { value: {} },
    keyResultErrorsByGoal: { value: {} },
    loadGoals,
    loadKeyResults,
    clearErrors,
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

function mountDialog(props: Record<string, unknown>) {
  return mount(TaskTemplateDialog, {
    props: { modelValue: true, ...props },
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
        Copy: true,
      },
    },
  });
}

function formModel(wrapper: ReturnType<typeof mountDialog>): TaskTemplateViewModel {
  return wrapper.findComponent(TaskTemplateFormStub).props('modelValue') as TaskTemplateViewModel;
}

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
          copyTitle: 'Copy task plan',
          copySubtitle: 'Copy',
          updateImpact:
            'Updates {count} future pending tasks; in-progress and historical tasks stay unchanged.',
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
    clearErrors.mockClear();
  });

  it('lets the goal binding section issue the single edit-mode KR request', async () => {
    mountDialog({ mode: 'edit', template: editTemplate() });
    await flushPromises();

    expect(loadGoals).toHaveBeenCalledTimes(1);
    expect(loadKeyResults).toHaveBeenCalledTimes(1);
    expect(loadKeyResults).toHaveBeenCalledWith('goal-a', false);
  });
});

describe('TaskTemplateDialog draft lifecycle', () => {
  beforeEach(() => {
    loadGoals.mockClear();
    loadKeyResults.mockClear();
    clearErrors.mockClear();
  });

  it('renders the localized title and description for the active intent', () => {
    const wrapper = mountDialog({ mode: 'create' });

    expect(wrapper.text()).toContain('Create task plan');
    expect(wrapper.text()).toContain('Create');
    expect(wrapper.text()).not.toContain("mode === 'edit'");
  });

  it('starts with a fresh create draft every time the dialog opens', async () => {
    const wrapper = mountDialog({ mode: 'create' });
    wrapper.findComponent(TaskTemplateFormStub).vm.$emit('update:modelValue', {
      ...formModel(wrapper),
      title: 'Unsaved title',
      tags: ['draft'],
    });
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });

    expect(formModel(wrapper).title).toBe('');
    expect(formModel(wrapper).tags).toEqual([]);
  });

  it('discards a cancelled create draft before the next open', async () => {
    const wrapper = mountDialog({ mode: 'create' });
    wrapper.findComponent(TaskTemplateFormStub).vm.$emit('update:modelValue', {
      ...formModel(wrapper),
      title: 'Cancelled title',
    });
    wrapper.findComponent(TaskTemplateFormStub).vm.$emit('close');
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });

    expect(formModel(wrapper).title).toBe('');
  });

  it('restores a dirty draft when the routed panel subtree is rebuilt', async () => {
    const first = mountDialog({ mode: 'create' });
    first.findComponent(TaskTemplateFormStub).vm.$emit('update:modelValue', {
      ...formModel(first),
      title: 'Recovered task plan',
    });
    await flushPromises();
    first.unmount();

    const rebuilt = mountDialog({ mode: 'create' });
    await flushPromises();

    expect(formModel(rebuilt).title).toBe('Recovered task plan');
  });

  it('uses the latest edit source each time it opens', async () => {
    const wrapper = mountDialog({ mode: 'edit', template: editTemplate() });
    wrapper.findComponent(TaskTemplateFormStub).vm.$emit('update:modelValue', {
      ...formModel(wrapper),
      title: 'Unsaved edit',
    });
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ template: { ...editTemplate(), title: 'Server refresh' } });
    await wrapper.setProps({ modelValue: true });

    expect(formModel(wrapper).title).toBe('Server refresh');
  });

  it('deep clones edit drafts so nested changes cannot mutate the source template', () => {
    const template = editTemplate();
    const wrapper = mountDialog({ mode: 'edit', template });

    formModel(wrapper).timeConfig.timeType = 'TimePoint';
    formModel(wrapper).goalBinding!.incrementValue = 9;

    expect(template.timeConfig.timeType).toBe('AllDay');
    expect(template.goalBinding?.incrementValue).toBe(1);
  });

  it('copies business configuration without template identity or runtime statistics', () => {
    const template: TaskTemplateViewModel = {
      ...editTemplate(),
      status: 'PAUSED',
      isActive: false,
      isPaused: true,
      instanceCount: 12,
      completedInstanceCount: 8,
      pendingInstanceCount: 4,
      completionRate: 67,
    };
    const wrapper = mountDialog({ mode: 'copy', template });

    expect(formModel(wrapper)).toMatchObject({
      id: '',
      title: 'Linked task',
      status: 'ACTIVE',
      isActive: true,
      isPaused: false,
      isArchived: false,
      instanceCount: 0,
      completedInstanceCount: 0,
      pendingInstanceCount: 0,
      completionRate: 0,
      goalBinding: template.goalBinding,
      timeConfig: template.timeConfig,
    });
    expect(formModel(wrapper).goalBinding).not.toBe(template.goalBinding);
    expect(formModel(wrapper).timeConfig).not.toBe(template.timeConfig);
  });

  it('copies nested reactive collections from task cards without a browser clone error', () => {
    const template = reactive({
      ...editTemplate(),
      tags: reactive(['weekly', 'review']),
      timeConfig: reactive({
        timeType: 'AllDay' as const,
        timeRange: reactive({ start: '09:00', end: '10:00' }),
      }),
    });

    const wrapper = mountDialog({ mode: 'copy', template });

    expect(formModel(wrapper).tags).toEqual(['weekly', 'review']);
    expect(formModel(wrapper).timeConfig.timeRange).toEqual({ start: '09:00', end: '10:00' });
    expect(formModel(wrapper).tags).not.toBe(template.tags);
    expect(formModel(wrapper).timeConfig.timeRange).not.toBe(template.timeConfig.timeRange);
  });

  it('requires the reopened draft to report valid before saving', async () => {
    const wrapper = mountDialog({ mode: 'create' });
    wrapper.findComponent(TaskTemplateFormStub).vm.$emit('update:validation', { isValid: true });
    await flushPromises();
    expect(
      wrapper.get('[data-testid="task-dialog-save-button"]').attributes('disabled'),
    ).toBeUndefined();

    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });

    expect(
      wrapper.get('[data-testid="task-dialog-save-button"]').attributes('disabled'),
    ).toBeDefined();
  });

  it('reports dirty only when the task-plan draft differs from its opening baseline', async () => {
    const wrapper = mountDialog({ mode: 'create' });
    await flushPromises();
    expect(wrapper.emitted('dirty-change')?.at(-1)).toEqual([false]);

    const baseline = formModel(wrapper);
    wrapper.findComponent(TaskTemplateFormStub).vm.$emit('update:modelValue', {
      ...baseline,
      title: 'Unsaved title',
    });
    await flushPromises();
    expect(wrapper.emitted('dirty-change')?.at(-1)).toEqual([true]);

    wrapper.findComponent(TaskTemplateFormStub).vm.$emit('update:modelValue', baseline);
    await flushPromises();
    expect(wrapper.emitted('dirty-change')?.at(-1)).toEqual([false]);
  });

  it('explains how many future pending tasks an edit will update', () => {
    const wrapper = mountDialog({
      mode: 'edit',
      template: { ...editTemplate(), futurePendingInstanceCount: 3 },
    });

    expect(wrapper.get('[data-testid="task-plan-update-impact"]').text()).toContain(
      'Updates 3 future pending tasks',
    );
  });

  it('omits the propagation notice when no future pending task is affected', () => {
    const wrapper = mountDialog({
      mode: 'edit',
      template: { ...editTemplate(), futurePendingInstanceCount: 0 },
    });

    expect(wrapper.find('[data-testid="task-plan-update-impact"]').exists()).toBe(false);
  });
});
