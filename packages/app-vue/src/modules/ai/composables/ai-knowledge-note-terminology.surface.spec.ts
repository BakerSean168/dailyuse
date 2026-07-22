import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 206: AI knowledge UX drops Resource-CRUD dual-track terminology.
 * User-facing copy and client helpers talk about knowledge notes / vault paths,
 * not database Resource CRUD. Agent tool id fetch_resource remains protocol-stable.
 */
describe('AI knowledge note terminology surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const en = readFileSync(resolve(repoRoot, 'packages/app-vue/src/locales/en-US.ts'), 'utf8');
  const zh = readFileSync(resolve(repoRoot, 'packages/app-vue/src/locales/zh-CN.ts'), 'utf8');
  const chatView = readFileSync(resolve(__dirname, 'useAIChatView.ts'), 'utf8');
  const qaWorkflow = readFileSync(resolve(__dirname, 'useAIKnowledgeQaWorkflow.ts'), 'utf8');
  const types = readFileSync(resolve(__dirname, 'types.ts'), 'utf8');

  it('locales present knowledge notes wording instead of repository resources', () => {
    expect(en).toContain("fetchResource: 'Fetch Note'");
    expect(en).toContain("matchedResources: '{count} note(s) matched in {ms} ms.'");
    expect(en).toContain('indexed knowledge notes with citations');
    expect(en).not.toContain("fetchResource: 'Fetch Resource'");
    expect(en).not.toContain('resource(s) matched');
    expect(en).not.toContain('indexed repository resources with citations');

    expect(zh).toContain("fetchResource: '读取笔记'");
    expect(zh).toContain('匹配到 {count} 篇笔记');
    expect(zh).toContain('已索引的知识笔记');
    expect(zh).not.toContain("fetchResource: '读取资源'");
    expect(zh).not.toContain('匹配到 {count} 个资源');
  });

  it('client helpers open/load knowledge notes without Resource dual-track names', () => {
    expect(chatView).toContain('requestOpenKnowledgeNote');
    expect(chatView).toContain('loadRecentKnowledgeNotes');
    expect(chatView).not.toContain('requestOpenResource');
    expect(chatView).not.toContain('fetchResources');
    expect(qaWorkflow).toContain('options.requestOpenKnowledgeNote');
    expect(qaWorkflow).not.toContain('requestOpenResource');
    expect(types).toContain('requestOpenKnowledgeNote');
    expect(types).not.toContain('requestOpenResource');
  });

  it('menu locales drop editor dual-track openInNewTab/fileInfo/createSubfolder keys', () => {
    expect(en).not.toMatch(/openInNewTab:\s*'/);
    expect(en).not.toMatch(/fileInfo:\s*'/);
    expect(en).not.toMatch(/createSubfolder:\s*'/);
    expect(zh).not.toMatch(/openInNewTab:\s*'/);
    expect(zh).not.toMatch(/fileInfo:\s*'/);
    expect(zh).not.toMatch(/createSubfolder:\s*'/);
  });
});
