/** @vitest-environment jsdom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import EditorToolbar from './EditorToolbar.vue';

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
          insertResource: 'Insert repository resource',
          exportSelfContained: 'Export self-contained markdown',
        },
      },
      common: {
        save: 'Save',
      },
    },
  },
});

describe('EditorToolbar', () => {
  it('emits a dedicated event for opening the unified resource picker', async () => {
    const wrapper = mount(EditorToolbar, {
      global: {
        plugins: [i18n],
      },
    });

    const button = wrapper.find('button[aria-label="Insert repository resource"]');
    await button.trigger('click');

    expect(wrapper.emitted('insert-resource')).toHaveLength(1);
  });
});
