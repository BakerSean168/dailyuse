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

const projectionSource = readFileSync(
  resolve(process.cwd(), 'src/modules/repository/views/KnowledgeProjectionWorkspaceView.vue'),
  'utf8',
);
const localVaultSource = readFileSync(
  resolve(process.cwd(), 'src/modules/repository/views/LocalVaultWorkspaceView.vue'),
  'utf8',
);
const entrySource = readFileSync(
  resolve(process.cwd(), 'src/modules/repository/views/RepositoryEntryView.vue'),
  'utf8',
);
const routerSource = readFileSync(
  resolve(process.cwd(), 'src/modules/repository/router/index.ts'),
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
    expect(wrapper.get('[data-testid="note-segment-governance"]').attributes('role')).toBe('tab');
    expect(wrapper.get('[data-testid="note-segment-governance"]').attributes('aria-selected')).toBe(
      'true',
    );
    expect(wrapper.find('#note-page-toolbar-actions').exists()).toBe(true);
    wrapper.unmount();
  });

  it('uses projection-only web entry and local vault desktop entry without legacy note routes', () => {
    expect(entrySource).toContain('LocalVaultWorkspaceView');
    expect(entrySource).toContain('KnowledgeProjectionWorkspaceView');
    expect(routerSource).toContain("path: '/repository'");
    expect(routerSource).not.toContain("path: '/note");
    expect(routerSource).not.toContain('note-edit');
  });

  it('keeps confirmed create and deep-link selection on the projection workspace', () => {
    expect(projectionSource).toContain('data-testid="knowledge-projection-workspace"');
    expect(projectionSource).toContain('createConfirmedKnowledgeNote');
    expect(projectionSource).toContain('noteQueryId');
    expect(projectionSource).toContain('route.query.note');
    expect(localVaultSource).toContain('route.query.note');
    expect(localVaultSource).toContain('applyNoteQuerySelection');
  });

  it('keeps projection create dialog confirmed-only; editDraft is draft-stage back (residual 201)', () => {
    expect(projectionSource).toContain('function editDraft()');
    expect(projectionSource).toContain("stage.value = 'draft'");
    expect(projectionSource).toContain("stage.value = 'review'");
    expect(projectionSource).toContain('function confirmCreate()');
    expect(projectionSource).toContain('createConfirmedKnowledgeNote');
    expect(projectionSource).toContain('confirmImmutable');

    const editDraftBody = projectionSource.match(
      /function editDraft\(\):\s*void\s*\{([\s\S]*?)\n\}/,
    )?.[1];
    expect(editDraftBody).toBeTruthy();
    expect(editDraftBody).toContain("stage.value = 'draft'");
    expect(editDraftBody).not.toMatch(/selectedNoteId|projectionId|update|save|write/);

    expect(projectionSource).not.toMatch(
      /updateKnowledgeNote|saveKnowledgeNote|writeConfirmedLocalVaultNote|editExistingNote/,
    );
    expect(localVaultSource).toContain('openInObsidian');
    expect(localVaultSource).not.toMatch(
      /updateLocalVaultNote|saveLocalVaultNote|editExistingNote|createConfirmedKnowledgeNote/,
    );
  });
});
