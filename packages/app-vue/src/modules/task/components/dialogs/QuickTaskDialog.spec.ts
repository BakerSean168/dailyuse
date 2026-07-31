import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import QuickTaskDialog from './QuickTaskDialog.vue';

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
      common: { cancel: 'Cancel' },
      task: {
        quickTask: {
          title: 'Quick task',
          subtitle: 'Create a task for today',
          name: 'Task',
          placeholder: 'What needs doing?',
          todayAllDay: 'Today · All day',
          create: 'Create',
        },
      },
    },
  },
});

function mountDialog() {
  return mount(QuickTaskDialog, {
    props: { modelValue: true },
    global: {
      plugins: [i18n],
      stubs: {
        Dialog: passThrough('Dialog'),
        DialogContent: passThrough('DialogContent'),
        DialogDescription: passThrough('DialogDescription'),
        DialogFooter: passThrough('DialogFooter'),
        DialogHeader: passThrough('DialogHeader'),
        DialogTitle: passThrough('DialogTitle'),
        Button: passThrough('Button', 'button'),
        Input: defineComponent({
          name: 'QuickTaskInputStub',
          props: ['modelValue'],
          emits: ['update:modelValue'],
          setup(props, { emit, attrs }) {
            return () =>
              h('input', {
                ...attrs,
                value: props.modelValue,
                onInput: (event: Event) =>
                  emit('update:modelValue', (event.target as HTMLInputElement).value),
              });
          },
        }),
        Label: passThrough('Label', 'label'),
        Zap: true,
      },
    },
  });
}

describe('QuickTaskDialog', () => {
  it('submits a trimmed title from the compact form', async () => {
    const wrapper = mountDialog();
    await wrapper.get('[data-testid="quick-task-title-input"]').setValue('  Ship review  ');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')).toEqual([[{ title: 'Ship review' }]]);
  });

  it('clears the draft when reopened', async () => {
    const wrapper = mountDialog();
    await wrapper.get('[data-testid="quick-task-title-input"]').setValue('Unsaved');
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });

    expect(
      (wrapper.get('[data-testid="quick-task-title-input"]').element as HTMLInputElement).value,
    ).toBe('');
  });

  it('reports dirty only while the title differs from its opening baseline', async () => {
    const wrapper = mountDialog();
    expect(wrapper.emitted('dirty-change')?.at(-1)).toEqual([false]);

    await wrapper.get('[data-testid="quick-task-title-input"]').setValue('Unsaved');
    expect(wrapper.emitted('dirty-change')?.at(-1)).toEqual([true]);

    await wrapper.get('[data-testid="quick-task-title-input"]').setValue('');
    expect(wrapper.emitted('dirty-change')?.at(-1)).toEqual([false]);
  });
});
