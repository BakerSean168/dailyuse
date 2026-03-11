/** @vitest-environment jsdom */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MarkdownEditor from './MarkdownEditor.vue';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

document.createRange = (() =>
  ({
    setStart: () => {},
    setEnd: () => {},
    getBoundingClientRect: () => new DOMRect(),
    getClientRects: () => ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: function* () {},
    }),
    commonAncestorContainer: document.body,
    cloneRange: () => document.createRange(),
    collapse: () => {},
    selectNodeContents: () => {},
    insertNode: () => {},
  }) as unknown as Range) as typeof document.createRange;

describe('MarkdownEditor', () => {
  it('emits pasted clipboard image files with the current selection', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: 'hello',
      },
      attachTo: document.body,
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });
    (wrapper.vm as any).insertTextAtSelection(' world', { from: 5, to: 5 });

    const file = new File(['data'], 'shot.png', { type: 'image/png' });
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
        getData: () => '',
      },
    });

    const editorRoot = wrapper.element.querySelector('.cm-content') as HTMLElement;
    editorRoot.dispatchEvent(pasteEvent);

    const emitted = wrapper.emitted('paste-files');
    expect(emitted).toHaveLength(1);
    expect(emitted?.[0]?.[0]).toEqual([file]);
    expect(emitted?.[0]?.[1]).toEqual({ from: 11, to: 11 });

    wrapper.unmount();
  });

  it('replaces the current selection via insertTextAtSelection', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: 'hello world',
      },
      attachTo: document.body,
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    (wrapper.vm as any).insertTextAtSelection('daily', { from: 6, to: 11 });

    const updates = wrapper.emitted('update:modelValue');
    expect(updates?.at(-1)?.[0]).toBe('hello daily');

    wrapper.unmount();
  });
});
