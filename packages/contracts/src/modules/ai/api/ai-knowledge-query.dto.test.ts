import { describe, expect, it } from 'vitest';
import { ReindexKnowledgeSchema } from './ai-knowledge-query.dto';

describe('ReindexKnowledgeSchema', () => {
  it('accepts a bounded targeted resource list for save/index feedback', () => {
    expect(ReindexKnowledgeSchema.parse({ resourceIds: ['resource-1'], force: false })).toEqual({
      resourceIds: ['resource-1'],
      force: false,
      limit: 200,
    });
  });

  it('rejects an empty targeted resource list', () => {
    expect(ReindexKnowledgeSchema.safeParse({ resourceIds: [] }).success).toBe(false);
  });
});
