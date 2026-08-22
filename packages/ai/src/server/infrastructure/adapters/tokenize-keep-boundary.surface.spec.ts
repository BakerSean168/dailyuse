import { describe, expect, it } from 'vitest';
import { buildRetrievalEmbedding, tokenize } from './knowledge-index-value-helpers';

/** AI-VNEXT-07: one shared tokenizer feeds deterministic API/Desktop retrieval. */
describe('knowledge retrieval tokenize surface', () => {
  it('keeps ASCII identifiers and CJK terms for cross-lingual local retrieval', () => {
    expect(tokenize('Hello_World x')).toEqual(['hello_world']);
    expect(tokenize('笔记 note')).toEqual(['笔记', 'note']);
    expect(tokenize('中文')).toEqual(['中文']);
    expect(tokenize('a')).toEqual([]);
  });

  it('projects CJK knowledge text into a non-zero deterministic retrieval vector', () => {
    const first = buildRetrievalEmbedding('MemoFlow 知识架构');
    const second = buildRetrievalEmbedding('MemoFlow 知识架构');
    expect(first).toEqual(second);
    expect(first.some((value) => value !== 0)).toBe(true);
  });
});
