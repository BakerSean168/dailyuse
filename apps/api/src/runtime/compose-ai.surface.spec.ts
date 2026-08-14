import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI API runtime composer surface.
 * AI API runtime composer 表面契约。
 *
 * Locks the Step B cutover: apps/api/src/main.ts must compose AI through the
 * local runtime composer, must no longer reference the retired
 * `createAIApiModule` / `AIApiModuleContext` transport composition or the
 * `@memoflow/ai/api` seam, and must keep the AI registration position between
 * Task and Goal. Only the composer may import the package `/api` seam; no app
 * code may deep-import `@memoflow/ai/server`. The package AI transport
 * (`packages/ai/src/api/module.ts`) must stay free of PrismaClient, config
 * reads and concrete adapter construction.
 *
 * 锁定 Step B 切换：apps/api/src/main.ts 必须通过本地 runtime composer 组装 AI，
 * 不再引用已退役的 `createAIApiModule` / `AIApiModuleContext` transport 组合或
 * `@memoflow/ai/api` seam，并保持 AI 注册位置位于 Task 与 Goal 之间。只有
 * composer 允许导入 package `/api` seam；app 代码不得 deep-import
 * `@memoflow/ai/server`。package AI transport（`packages/ai/src/api/module.ts`）
 * 必须不含 PrismaClient、config 读取与 concrete adapter 构造。
 */
describe('AI API runtime composer surface', () => {
  const apiDir = resolve(__dirname, '..');
  const aiPackageApiModule = resolve(apiDir, '../../../packages/ai/src/api/module.ts');
  const main = readFileSync(resolve(apiDir, 'main.ts'), 'utf8');
  const composer = readFileSync(resolve(apiDir, 'runtime/compose-ai.ts'), 'utf8');
  const transportModule = readFileSync(aiPackageApiModule, 'utf8');

  it('main.ts composes AI via composeAI({ db: prisma, repositoryApiPort, repositoryStorageBaseDir })', () => {
    expect(main).toContain("from './runtime/compose-ai'");
    expect(main).toMatch(
      /composeAI\(\{\s*db: prisma,\s*repositoryApiPort: repositoryApiModule\.getApplicationPort\(\),\s*repositoryStorageBaseDir,\s*\}/,
    );
    expect(main).toContain('.register(aiApiModule)');
  });

  it('keeps the AI registration between Task and Goal (taskApiModule → aiApiModule → goalApiModule)', () => {
    const taskIndex = main.indexOf('.register(taskApiModule)');
    const aiIndex = main.indexOf('.register(aiApiModule)');
    const goalIndex = main.indexOf('.register(goalApiModule)');
    expect(taskIndex).toBeGreaterThan(-1);
    expect(aiIndex).toBeGreaterThan(-1);
    expect(goalIndex).toBeGreaterThan(-1);
    expect(taskIndex).toBeLessThan(aiIndex);
    expect(aiIndex).toBeLessThan(goalIndex);
  });

  it('main.ts no longer names createAIApiModule/AIApiModuleContext or imports the ai/api seam', () => {
    expect(main).not.toMatch(/\bcreateAIApiModule\b/);
    expect(main).not.toMatch(/\bAIApiModuleContext\b/);
    expect(main).not.toContain("from '@memoflow/ai/api'");
  });

  it('only the local composer imports the package /api seam in apps/api', () => {
    const matches: string[] = [];
    collectFilesWithImport(apiDir, "from '@memoflow/ai/api'", matches);
    expect(matches).toEqual(['runtime/compose-ai.ts']);
  });

  it('no app code deep-imports @memoflow/ai/server', () => {
    const matches: string[] = [];
    collectFilesWithImport(apiDir, "@memoflow/ai/server", matches);
    expect(matches).toEqual([]);
  });

  it('composer imports only the package root and /api seams (no deep /server import)', () => {
    expect(composer).toContain('interface ComposeAIDependencies');
    expect(composer).toContain("from '@memoflow/ai'");
    expect(composer).toContain("from '@memoflow/ai/api'");
    expect(composer).not.toMatch(/@memoflow\/ai\/server/);
  });

  it('AI transport module.ts stays DB-free: no PrismaClient, no config, no concrete adapter construction', () => {
    const forbidden = [
      'PrismaClient',
      'context.db',
      'getAIServiceRuntimeConfig',
      'AIConversationPrismaRepository',
      'AIProviderConfigPrismaRepository',
      'AIKnowledgeIndexPrismaRepository',
      'AIExecutionLogPrismaAdapter',
      'AgentCheckpointPrismaAdapter',
      'LangGraphCheckpointPrismaAdapter',
      'AIEvaluationReportFileAdapter',
      /AIService[A-Za-z]+Adapter/,
    ];
    for (const pattern of forbidden) {
      if (pattern instanceof RegExp) {
        expect(transportModule).not.toMatch(pattern);
      } else {
        expect(transportModule).not.toContain(pattern);
      }
    }
  });

  it('AI transport module.ts keeps the twelve exact relative mounts in order', () => {
    const mounts = [
      "router.use('/ai/providers', providerRoutes);",
      "router.use('/ai', capabilityRoutes);",
      "router.use('/ai/agents', agentRuntimeRoutes);",
      "router.use('/ai/chat', chatRoutes);",
      "router.use('/ai/assistant', assistantRoutes);",
      "router.use('/ai/knowledge', knowledgeQueryRoutes);",
      "router.use('/ai/knowledge-notes', knowledgeNoteRoutes);",
      "router.use('/ai/analytics', analyticsQueryRoutes);",
      "router.use('/ai', evaluationReportRoutes);",
      "router.use('/ai/generate', goalRoutes);",
      "router.use('/internal/agents/checkpoints', checkpointRoutes);",
      "router.use('/internal/agents/langgraph-checkpoints', langGraphCheckpointRoutes);",
    ];
    let cursor = 0;
    for (const mount of mounts) {
      const index = transportModule.indexOf(mount, cursor);
      expect(index).toBeGreaterThan(-1);
      cursor = index + mount.length;
    }
  });
});

function collectFilesWithImport(
  dir: string,
  needle: string,
  matches: string[],
  rootDir: string = dir,
): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFilesWithImport(full, needle, matches, rootDir);
    } else if (
      full.endsWith('.ts') &&
      !full.endsWith('.d.ts') &&
      !full.includes('.spec.') &&
      !full.includes('.test.')
    ) {
      const content = readFileSync(full, 'utf8');
      if (content.includes(needle)) {
        matches.push(full.slice(rootDir.length + 1).replaceAll('\\', '/'));
      }
    }
  }
}
