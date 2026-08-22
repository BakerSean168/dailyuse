import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AI knowledge deep-link surface', () => {
  const chatView = readFileSync(resolve(__dirname, 'useAIChatView.ts'), 'utf8');
  const capture = readFileSync(resolve(__dirname, 'useAIKnowledgeCapture.ts'), 'utf8');
  const repositoryRouter = readFileSync(resolve(__dirname, '../../repository/router/index.ts'), 'utf8');

  it('opens citations and completed capture notes in the repository workspace only', () => {
    expect(chatView).toContain("path: '/repository'");
    expect(chatView).toContain('query: { note: noteId }');
    expect(chatView).not.toContain("path: '/note");
    expect(capture).toContain('openCreatedNote');
    expect(repositoryRouter).toContain("path: '/repository'");
    expect(repositoryRouter).not.toContain("path: '/note");
  });
});
