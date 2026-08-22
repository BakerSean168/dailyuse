import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));

function findWorkspaceRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = dirname(current);
    if (parent === current) throw new Error('Unable to locate MemoFlow workspace root');
    current = parent;
  }
}

const WORKSPACE_ROOT = findWorkspaceRoot(HERE);

const RETIRED_RUNTIME_FILES = [
  'Dockerfile.ai-service',
  'apps/ai-service/project.json',
  'packages/contracts/src/modules/ai/api/ai-agent.dto.ts',
  'packages/contracts/src/modules/ai/agent-host/index.ts',
  'packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts',
  'packages/ai/src/server/infrastructure/proposal-kernel/proposal.kernel.ts',
  'packages/ai/src/server/infrastructure/capability-resolver/capability.resolver.ts',
  'packages/ai/src/server/infrastructure/turn-engine/direct-turn.engine.ts',
  'packages/ai/src/server/infrastructure/workflow/langgraph-workflow.adapter.ts',
  'packages/ai/src/server/infrastructure/runtime/remote-ai-service.runtime.ts',
  'packages/ai/src/server/infrastructure/runtime/direct-provider-ai.runtime.ts',
  'packages/app-react/src/hooks/useAIService.ts',
  'packages/app-vue/src/modules/ai/composables/isRecord.ts',
  'packages/app-vue/src/modules/ai/composables/useAIKnowledgeNoteWorkflow.ts',
  'packages/goal/src/ai/ai-service-factory.ts',
] as const;

const PRODUCTION_SOURCE_ROOTS = [
  'packages/ai/src',
  'packages/app-vue/src/modules/ai',
  'packages/app-react/src',
  'packages/contracts/src/modules/ai',
  'apps/api/src',
  'apps/desktop/src',
  'apps/web/src',
] as const;

const RETIRED_TRANSPORT_TOKENS = [
  '/ai/agents/runs',
  '/ai/assistant/dispatch',
  'ai:assistant:dispatch',
  'ai:agent:',
  'ai:chat:message:stream:',
] as const;

const RETIRED_UI_STATE_TOKENS = ['pendingActions', 'approvedActions', 'dependsOn'] as const;

function productionSourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = join(root, entry.name);
    if (entry.isDirectory()) {
      if (['dist', 'node_modules', 'generated'].includes(entry.name)) return [];
      return productionSourceFiles(target);
    }
    if (!/\.(?:ts|tsx|vue)$/.test(entry.name)) return [];
    if (/\.(?:spec|test)\.(?:ts|tsx)$/.test(entry.name)) return [];
    return [target];
  });
}

function findTokenViolations(roots: readonly string[], tokens: readonly string[]): string[] {
  const violations: string[] = [];
  for (const root of roots) {
    const absoluteRoot = resolve(WORKSPACE_ROOT, root);
    for (const file of productionSourceFiles(absoluteRoot)) {
      const source = readFileSync(file, 'utf8');
      for (const token of tokens) {
        if (source.includes(token)) {
          violations.push(`${relative(WORKSPACE_ROOT, file)} -> ${token}`);
        }
      }
    }
  }
  return violations;
}

describe('AI-VNEXT-07 legacy runtime removal lock', () => {
  it('keeps retired Python / AgentHost / dual-runtime entry files physically absent', () => {
    const remaining = RETIRED_RUNTIME_FILES.filter((file) => existsSync(resolve(WORKSPACE_ROOT, file)));
    expect(remaining).toEqual([]);
  });

  it('keeps production transports on canonical Mastra Assistant/Workflow endpoints only', () => {
    expect(findTokenViolations(PRODUCTION_SOURCE_ROOTS, RETIRED_TRANSPORT_TOKENS)).toEqual([]);
  });

  it('keeps production Vue AI state free of the retired AgentAction DAG', () => {
    expect(findTokenViolations(['packages/app-vue/src/modules/ai'], RETIRED_UI_STATE_TOKENS)).toEqual([]);
  });

  it('keeps deploy/runtime configuration free of the retired Python service', () => {
    const deploymentFiles = [
      '.env.example',
      '.env.development',
      '.env.production',
      'docker-compose.local.yml',
      'docker-compose.prod.yml',
      '.github/workflows/docker-deploy.yml',
      '.github/actions/setup-nx-affected-job/action.yml',
      'tools/runtime/profiles.json',
      'tools/runtime/self-check.mjs',
      'tools/docker/local-compose.mjs',
      'tools/docker/env-shadow.mjs',
      'tools/ci-cd-platform/lib/scope-detector.mjs',
      'tools/agent-skills/validate-local-deploy/scripts/run-validation.mjs',
      'tools/agent-skills/validate-local-deploy/scripts/local-docker-evidence.mjs',
      'tools/agent-skills/validate-local-deploy/scripts/image-freshness.mjs',
    ];
    const forbidden = ['ai-service', 'AI_SERVICE_', 'INTERNAL_AI_', 'LANGGRAPH_', 'AGENT_HOST_'];
    const violations = deploymentFiles.flatMap((file) => {
      const absolute = resolve(WORKSPACE_ROOT, file);
      if (!existsSync(absolute)) return [];
      const source = readFileSync(absolute, 'utf8');
      return forbidden
        .filter((token) => source.includes(token))
        .map((token) => `${file} -> ${token}`);
    });
    expect(violations).toEqual([]);
  });
});
