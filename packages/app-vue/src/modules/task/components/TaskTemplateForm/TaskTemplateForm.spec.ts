import { computed, defineComponent, h, ref, type Component } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TaskTemplateForm from './TaskTemplateForm.vue';
import type { TaskTemplateViewModel } from '../types';

const isFormValid = ref(true);
const validateForm = vi.fn().mockResolvedValue(true);
const updateBasicValidation = vi.fn();
const updateTimeValidation = vi.fn();
const updateRecurrenceValidation = vi.fn();
const updateReminderValidation = vi.fn();
const updateGoalBindingValidation = vi.fn();
const updateMetadataValidation = vi.fn();

vi.mock('../../composables/useTaskTemplateForm', () => ({
  useTaskTemplateForm: () => ({
    isFormValid: computed(() => isFormValid.value),
    validateForm,
    updateBasicValidation,
    updateTimeValidation,
    updateRecurrenceValidation,
    updateReminderValidation,
    updateGoalBindingValidation,
    updateMetadataValidation,
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      task: {
        templateForm: {
          loadError: 'Template not available',
          notFoundMessage: 'The selected template no longer exists.',
          close: 'Close',
        },
      },
    },
  },
});

function createSectionStub(
  name: string,
  emitValue?: (modelValue: TaskTemplateViewModel) => TaskTemplateViewModel,
): Component {
  return defineComponent({
    name: `${name}Stub`,
    props: ['modelValue'],
    emits: ['update:model-value', 'update:validation'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            'data-stub': name,
            onClick: () => {
              emit('update:validation', { isValid: true });
              if (emitValue) {
                emit('update:model-value', emitValue(props.modelValue as TaskTemplateViewModel));
              }
            },
          },
          name,
        );
    },
  });
}

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['disabled', 'variant', 'size'],
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
        },
        slots.default?.(),
      );
  },
});

function createTemplate(overrides: Partial<TaskTemplateViewModel> = {}): TaskTemplateViewModel {
  return {
    id: 'template-1',
    title: 'Morning planning',
    status: 'Active',
    timeConfig: {
      timeType: 'AllDay',
    },
    ...overrides,
  };
}

function mountForm(modelValue: TaskTemplateViewModel | null = createTemplate()) {
  return mount(TaskTemplateForm, {
    props: {
      modelValue,
      isEditMode: true,
      goals: [{ id: 'goal-1', title: 'Ship tests' }],
      keyResultsByGoal: {},
    },
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        AlertCircle: true,
        BasicInfoSection: createSectionStub('BasicInfoSection', (value) => ({
          ...value,
          title: 'Updated title',
        })),
        TimeConfigSection: createSectionStub('TimeConfigSection'),
        RecurrenceSection: createSectionStub('RecurrenceSection'),
        ReminderSection: createSectionStub('ReminderSection'),
        MetadataSection: createSectionStub('MetadataSection'),
        KeyResultLinksSection: createSectionStub('KeyResultLinksSection'),
      },
    },
  });
}

describe('TaskTemplateForm', () => {
  beforeEach(() => {
    isFormValid.value = true;
    validateForm.mockClear();
    updateBasicValidation.mockClear();
    updateTimeValidation.mockClear();
    updateRecurrenceValidation.mockClear();
    updateReminderValidation.mockClear();
    updateGoalBindingValidation.mockClear();
    updateMetadataValidation.mockClear();
  });

  it('shows a recoverable load error state when no template is available', async () => {
    const wrapper = mountForm(null);

    expect(wrapper.text()).toContain('Template not available');
    expect(wrapper.text()).toContain('The selected template no longer exists.');

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('close')).toEqual([[]]);
  });

  it('re-emits section updates and the current validation state', async () => {
    const wrapper = mountForm();

    expect(wrapper.emitted('update:validation')).toEqual([[{ isValid: true }]]);

    await wrapper.get('[data-stub="BasicInfoSection"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]?.[0]).toMatchObject({
      id: 'template-1',
      title: 'Updated title',
    });
  });

  it('includes key-result binding validity in the whole form state', async () => {
    const wrapper = mountForm();

    await wrapper.get('[data-stub="KeyResultLinksSection"]').trigger('click');

    expect(updateGoalBindingValidation).toHaveBeenCalledWith({ isValid: true });
  });

  it('exposes the composable validate method to parent callers', async () => {
    const wrapper = mountForm();

    await (wrapper.vm as unknown as { validate: () => Promise<boolean> }).validate();

    expect(validateForm).toHaveBeenCalledTimes(1);
  });
});
