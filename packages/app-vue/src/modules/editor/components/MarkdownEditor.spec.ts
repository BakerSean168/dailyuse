/** @vitest-environment jsdom */

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

beforeEach(() => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    configurable: true,
  });
});

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

  it('detects pasted image files even when the clipboard item type is empty', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: 'hello',
      },
      attachTo: document.body,
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    const file = new File(['data'], 'shot.png', { type: 'image/png' });
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [
          {
            kind: 'file',
            type: '',
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

  it('toggles markdown task list items from the live preview checkbox', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: '- [ ] ship live preview',
      },
      attachTo: document.body,
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    const checkbox = wrapper.element.querySelector('.cm-md-task-checkbox') as HTMLButtonElement | null;
    expect(checkbox).not.toBeNull();

    checkbox?.click();

    const updates = wrapper.emitted('update:modelValue');
    expect(updates?.at(-1)?.[0]).toBe('- [x] ship live preview');

    wrapper.unmount();
  });

  it('emits link-click when clicking a live preview wiki link chip', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: 'See [[Roadmap]] next',
      },
      attachTo: document.body,
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    const wikiChip = wrapper.element.querySelector('[data-wiki-title="Roadmap"]') as HTMLElement | null;
    expect(wikiChip).not.toBeNull();

    wikiChip?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(wrapper.emitted('link-click')?.at(-1)?.[0]).toBe('Roadmap');

    wrapper.unmount();
  });

  it('opens an image lightbox when clicking a live preview image', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: 'Intro\n![demo](data:image/png;base64,ZmFrZQ==)',
      },
      attachTo: document.body,
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    const image = wrapper.element.querySelector('[data-image-preview-src]') as HTMLImageElement | null;
    expect(image).not.toBeNull();

    image?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await wrapper.vm.$nextTick();

    const overlayImage = wrapper.element.querySelector('.z-20 img') as HTMLImageElement | null;
    expect(overlayImage?.getAttribute('src')).toContain('data:image/png;base64,ZmFrZQ==');

    wrapper.unmount();
  });

  it('copies fenced code block contents from the live preview header action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const wrapper = mount(MarkdownEditor, {
      props: {
        modelValue: 'Intro\n```ts\nconst answer = 42;\n```',
      },
      attachTo: document.body,
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });

    const copyButton = wrapper.element.querySelector('[data-code-copy-from][data-code-copy-to]') as HTMLButtonElement | null;
    expect(copyButton).not.toBeNull();

    copyButton?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('const answer = 42;');

    wrapper.unmount();
  });
});
