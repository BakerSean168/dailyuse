import { describe, expect, it } from 'vitest';
import { AIKnowledgeNotePathResolver } from './ai-knowledge-note-path-resolver';

describe('AIKnowledgeNotePathResolver', () => {
  const resolver = new AIKnowledgeNotePathResolver();

  it('does not invent a fixed directory when the confirmed proposal has no subpath', () => {
    expect(resolver.resolve('', 'Repository Root Note')).toEqual({
      directoryPath: '',
      fileName: 'Repository-Root-Note.md',
      path: 'Repository-Root-Note.md',
    });
  });

  it('normalizes only the subpath supplied by the confirmed proposal', () => {
    expect(resolver.resolve(' projects\\daily / inbox ', 'Daily Review')).toEqual({
      directoryPath: 'projects/daily/inbox',
      fileName: 'Daily-Review.md',
      path: 'projects/daily/inbox/Daily-Review.md',
    });
  });
});
