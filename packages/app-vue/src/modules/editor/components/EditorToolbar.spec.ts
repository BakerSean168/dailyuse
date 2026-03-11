/** @vitest-environment jsdom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import EditorToolbar from './EditorToolbar.vue';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      editor: {
        toolbar: {
          title: 'Markdown Editor',
          heading: 'Heading {level}',
          column: 'Col',
          content: 'Content',
          insertLink: 'Insert link markdown',
          insertImage: 'Insert image markdown',
          insertExistingImage: 'Insert repository image',
        },
      },
      common: {
        save: 'Save',
      },
    },
  },
});

describe('EditorToolbar', () => {
  it('emits a dedicated event for inserting repository images', async () => {
    const wrapper = mount(EditorToolbar, {
      global: {
        plugins: [i18n],
      },
    });

    const button = wrapper.find('button[aria-label="Insert repository image"]');
    await button.trigger('click');

    expect(wrapper.emitted('insert-existing-image')).toHaveLength(1);
  });
});
