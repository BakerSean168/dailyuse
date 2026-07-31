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
  // Modular locale tree (zh-CN/ / en-US/ directories); read AI + menu modules.
  const enAi = readFileSync(
    resolve(repoRoot, 'packages/app-vue/src/locales/en-US/aiAssistant.ts'),
    'utf8',
  );
  const zhAi = readFileSync(
    resolve(repoRoot, 'packages/app-vue/src/locales/zh-CN/aiAssistant.ts'),
    'utf8',
  );
  const enMenu = readFileSync(
    resolve(repoRoot, 'packages/app-vue/src/locales/en-US/menu.ts'),
    'utf8',
  );
  const zhMenu = readFileSync(
    resolve(repoRoot, 'packages/app-vue/src/locales/zh-CN/menu.ts'),
    'utf8',
  );
  const chatView = readFileSync(resolve(__dirname, 'useAIChatView.ts'), 'utf8');
  const qaWorkflow = readFileSync(resolve(__dirname, 'useAIKnowledgeQaWorkflow.ts'), 'utf8');
  const types = readFileSync(resolve(__dirname, 'types.ts'), 'utf8');

  it('locales present knowledge notes wording instead of repository resources', () => {
    expect(enAi).toMatch(/["']?fetchResource["']?\s*:\s*["']Fetch Note["']/);
    expect(enAi).toMatch(
      /["']?matchedResources["']?\s*:\s*["']\{count\} note\(s\) matched in \{ms\} ms\.["']/,
    );
    expect(enAi).toContain('indexed knowledge notes with citations');
    expect(enAi).not.toMatch(/["']?fetchResource["']?\s*:\s*["']Fetch Resource["']/);
    expect(enAi).not.toContain('resource(s) matched');
    expect(enAi).not.toContain('indexed repository resources with citations');

    expect(zhAi).toMatch(/["']?fetchResource["']?\s*:\s*["']读取笔记["']/);
    expect(zhAi).toContain('匹配到 {count} 篇笔记');
    expect(zhAi).toContain('已索引的知识笔记');
    expect(zhAi).not.toMatch(/["']?fetchResource["']?\s*:\s*["']读取资源["']/);
    expect(zhAi).not.toContain('匹配到 {count} 个资源');
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
    // Match both legacy `key: '…'` and modular `"key": "…"` forms.
    for (const menu of [enMenu, zhMenu]) {
      expect(menu).not.toMatch(/["']?openInNewTab["']?\s*:/);
      expect(menu).not.toMatch(/["']?fileInfo["']?\s*:/);
      expect(menu).not.toMatch(/["']?createSubfolder["']?\s*:/);
    }
  });
});
