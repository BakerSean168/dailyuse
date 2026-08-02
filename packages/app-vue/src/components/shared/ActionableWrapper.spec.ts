import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ActionableWrapper from './ActionableWrapper.vue';

const passthrough = (name: string) =>
  defineComponent({
    name,
    setup(_props, { attrs, slots }) {
      return () => h('div', attrs, slots.default?.());
    },
  });

describe('ActionableWrapper accessibility contract', () => {
  it('names and sizes the icon-only action menu trigger', () => {
    const wrapper = mount(ActionableWrapper, {
      props: {
        actions: [{ key: 'edit', label: 'Edit', handler: () => undefined }],
        moreButtonLabel: 'More task actions',
        moreButtonTestId: 'more-actions',
      },
      slots: { default: '<div>Task</div>' },
      global: {
        stubs: {
          ContextMenu: passthrough('ContextMenu'),
          ContextMenuTrigger: passthrough('ContextMenuTrigger'),
          ContextMenuContent: passthrough('ContextMenuContent'),
          ContextMenuItem: passthrough('ContextMenuItem'),
          ContextMenuSeparator: true,
          ContextMenuShortcut: true,
          DropdownMenu: passthrough('DropdownMenu'),
          DropdownMenuTrigger: passthrough('DropdownMenuTrigger'),
          DropdownMenuContent: passthrough('DropdownMenuContent'),
          DropdownMenuItem: passthrough('DropdownMenuItem'),
          DropdownMenuSeparator: true,
          DropdownMenuShortcut: true,
        },
      },
    });

    const trigger = wrapper.get('[data-testid="more-actions"]');
    expect(trigger.element.tagName).toBe('BUTTON');
    expect(trigger.attributes('type')).toBe('button');
    expect(trigger.attributes('aria-label')).toBe('More task actions');
    expect(trigger.classes()).toEqual(expect.arrayContaining(['h-8', 'w-8']));
  });
});
