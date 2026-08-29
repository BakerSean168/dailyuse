// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LabelCommandPanel from './LabelCommandPanel.vue';
import LabelFilterPopover from './LabelFilterPopover.vue';
import type { LabelPickerOption } from './label-selection.types';

const options: LabelPickerOption[] = [
  { id: 'work', name: 'Work' },
  { id: 'deep', name: 'Deep Work' },
  { id: 'health', name: 'Health' },
];

const popoverStubs = {
  Popover: { template: '<div data-stub="popover"><slot /></div>' },
  PopoverTrigger: { template: '<div data-stub="trigger"><slot /></div>' },
  PopoverContent: { template: '<div data-stub="content"><slot /></div>' },
};

describe('LabelFilterPopover (UI-5101)', () => {
  it('reuses the shared Command panel, disables creation, and makes AND semantics explicit', () => {
    const wrapper = mount(LabelFilterPopover, {
      props: { modelValue: ['work', 'deep'], options },
      global: { stubs: popoverStubs },
    });

    const trigger = wrapper.get('[data-testid="label-filter-trigger"]');
    expect(trigger.text()).toContain('Labels');
    expect(trigger.text()).toContain('2');
    expect(wrapper.text()).toContain('Matches all selected labels');
    expect(wrapper.getComponent(LabelCommandPanel).props('allowCreate')).toBe(false);
  });

  it('emits filter changes and clears all selected labels through semantic buttons', async () => {
    const wrapper = mount(LabelFilterPopover, {
      props: { modelValue: ['work'], options },
      global: { stubs: popoverStubs },
    });
    const panel = wrapper.getComponent(LabelCommandPanel);

    panel.vm.$emit('update:modelValue', ['work', 'health']);
    const clearButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === 'Clear');
    expect(clearButton).toBeDefined();
    await clearButton!.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['work', 'health']], [[]]]);
  });
});
