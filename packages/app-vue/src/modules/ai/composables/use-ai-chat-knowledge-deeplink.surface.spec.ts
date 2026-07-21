import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI knowledge note deep-link surface (stage-6 residual 74 / §13.2):
 * openRecentKnowledgeNote lands on /repository?note= — never /note/:id.
 */
describe('useAIChatView knowledge deep-link surface', () => {
  const chatView = readFileSync(resolve(__dirname, 'useAIChatView.ts'), 'utf8');
  const knowledgeWorkflow = readFileSync(
    resolve(__dirname, 'useAIKnowledgeNoteWorkflow.ts'),
    'utf8',
  );
  const repositoryRouter = readFileSync(
    resolve(__dirname, '../../repository/router/index.ts'),
    'utf8',
  );

  it('opens knowledge notes in repository workspace only', () => {
    expect(chatView).toContain("path: '/repository'");
    expect(chatView).toContain('query: { note: noteId }');
    expect(chatView).toContain('openKnowledgeNoteInRepository');
    expect(chatView).not.toContain("path: '/note");
    expect(chatView).not.toContain("'/note/");

    expect(knowledgeWorkflow).toContain("path: '/repository'");
    expect(knowledgeWorkflow).toContain('query: { note: resolvedPath }');
    expect(knowledgeWorkflow).not.toContain("path: '/note");

    expect(repositoryRouter).toContain("path: '/repository'");
    expect(repositoryRouter).not.toContain("path: '/note");
  });
});
