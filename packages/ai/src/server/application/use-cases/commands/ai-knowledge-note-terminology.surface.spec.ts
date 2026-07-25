import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 207: server/product copy after Resource CRUD retirement talks about
 * knowledge notes, not repository resources. Protocol ids (fetch_resource,
 * matchedResourceCount, maxResources, resourceId) stay stable.
 */
describe('AI server knowledge note terminology surface', () => {
  const dir = __dirname;
  const query = readFileSync(resolve(dir, 'query-knowledge.use-case.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'generate-ai-goal.use-case.ts'), 'utf8');
  const sync = readFileSync(resolve(dir, 'sync-knowledge-notes.use-case.ts'), 'utf8');

  it('empty knowledge answers use note wording', () => {
    expect(query).toContain(
      "answer: 'No relevant knowledge notes were found for this question.'",
    );
    expect(query).not.toContain('No relevant repository resources were found');
  });

  it('goal recovery and index errors use note wording', () => {
    expect(goal).toContain(
      "'Refresh knowledge notes or narrow the note query before retrying execution.'",
    );
    expect(goal).not.toContain('Refresh repository resources');
    expect(sync).toContain('note(s) failed during knowledge indexing');
    expect(sync).not.toContain('resource(s) failed during knowledge indexing');
  });
});
