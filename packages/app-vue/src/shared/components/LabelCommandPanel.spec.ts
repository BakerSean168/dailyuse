// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { Command, CommandInput, CommandItem } from '@memoflow/ui-vue-shadcn';
import LabelCommandPanel from './LabelCommandPanel.vue';
import type { LabelPickerOption } from './label-selection.types';

const options: LabelPickerOption[] = [
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'deep', name: 'Deep Work', color: '#8b5cf6' },
  { id: 'health', name: 'Health', color: null },
];

describe('LabelCommandPanel (UI-5101)', () => {
  it('delegates multi-selection to shadcn/Reka Command and emits controlled ids', async () => {
    const wrapper = mount(LabelCommandPanel, {
      props: { modelValue: ['work'], options },
    });
    const command = wrapper.getComponent(Command);

    expect(command.props('multiple')).toBe(true);
    expect(command.props('modelValue')).toEqual(['work']);
    expect(command.props('resetSearchTermOnSelect')).toBe(false);

    command.vm.$emit('update:modelValue', ['work', 'deep', 'deep']);
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toEqual([[['work', 'deep']]]);
  });

  it('lets the underlying Command engine filter by label text instead of implementing a local search loop', async () => {
    const wrapper = mount(LabelCommandPanel, {
      props: { modelValue: [], options },
    });

    await wrapper.get('input').setValue('health');
    await nextTick();

    expect(wrapper.text()).toContain('Health');
    expect(wrapper.text()).not.toContain('Deep Work');
    expect(wrapper.text()).not.toContain('Work');
  });

  it('uses CommandInput search and exposes create intent only when no exact label exists', async () => {
    const wrapper = mount(LabelCommandPanel, {
      props: {
        modelValue: [],
        options,
        allowCreate: true,
        createLabel: 'Create',
      },
    });
    const input = wrapper.getComponent(CommandInput);

    input.vm.$emit('update:modelValue', '  New   Focus  ');
    await nextTick();

    const createItem = wrapper
      .findAllComponents(CommandItem)
      .find((item) => String(item.props('value')).startsWith('__memoflow_label_create__:'));
    expect(createItem).toBeDefined();
    expect(createItem?.text()).toContain('Create “New Focus”');

    const preventDefault = vi.fn();
    createItem?.vm.$emit('select', { preventDefault });
    await nextTick();
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('create')).toEqual([['New Focus']]);

    const exactWrapper = mount(LabelCommandPanel, {
      props: {
        modelValue: [],
        options,
        allowCreate: true,
        createLabel: 'Create',
      },
    });
    exactWrapper.getComponent(CommandInput).vm.$emit('update:modelValue', ' deep   work ');
    await nextTick();
    expect(
      exactWrapper
        .findAllComponents(CommandItem)
        .some((item) => String(item.props('value')).startsWith('__memoflow_label_create__:')),
    ).toBe(false);
  });
});
