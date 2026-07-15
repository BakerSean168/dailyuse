/** @vitest-environment happy-dom */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import NoteSegmentBar from '../components/NoteSegmentBar.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      repository: { segments: { notes: 'Notes', governance: 'Standards' } },
    },
  },
});

const workspaceSource = readFileSync(
  resolve(process.cwd(), 'src/modules/repository/views/RepositoryWorkspaceView.vue'),
  'utf8',
);
const treeSource = readFileSync(
  resolve(process.cwd(), 'src/modules/repository/components/TypedFileTree.vue'),
  'utf8',
);
const editorSource = readFileSync(
  resolve(process.cwd(), 'src/modules/editor/views/EditorLinearView.vue'),
  'utf8',
);

describe('Note single-page architecture', () => {
  it('owns one stable toolbar for note and governance segments', async () => {
    const wrapper = mount(NoteSegmentBar, {
      attachTo: document.body,
      props: { active: 'notes' },
      global: { plugins: [i18n] },
    });
    const toolbar = wrapper.get('[data-testid="note-page-toolbar"]');

    toolbar.element.setAttribute('style', 'width: 360px');
    await wrapper.setProps({ active: 'governance' });
    toolbar.element.setAttribute('style', 'width: 1000px');

    expect(wrapper.findAll('[data-testid="note-page-toolbar"]')).toHaveLength(1);
    expect(wrapper.get('[data-testid="note-page-toolbar"]').element).toBe(toolbar.element);
    expect(wrapper.get('[data-testid="note-segment-governance"]').attributes('aria-pressed')).toBe(
      'true',
    );
    expect(wrapper.find('#note-page-toolbar-actions').exists()).toBe(true);
    wrapper.unmount();
  });

  it('keeps one workspace/editor DOM and one primary create owner', () => {
    expect(workspaceSource).toContain('data-primary-action="create-note"');
    expect(workspaceSource).toContain(':disabled="!workspaceScene.status.isReady"');
    expect(workspaceSource).not.toContain('usePanelWidth');
    expect(workspaceSource).not.toContain('isNarrow');
    expect(workspaceSource).not.toContain('repository-create-note-narrow');
    expect(treeSource).not.toContain("'create-note'");
    expect(editorSource).not.toContain('usePanelWidth');
    expect(editorSource).not.toContain('isNarrow');
    expect(editorSource).not.toContain('note-context-narrow-hint');
  });
});
