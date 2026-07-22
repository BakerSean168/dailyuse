import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 215: agent/knowledge context input uses snake_case wire keys only.
 * No camelCase dual-track for analytics_context / related_resources /
 * indexed_resources / context_errors / provider_config top-level keys.
 */
describe('AI service agent input snake_case surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const agentsPy = readFileSync(
    resolve(repoRoot, 'apps/ai-service/src/ai_service/api/routes/agents.py'),
    'utf8',
  );
  const aiRuntime = readFileSync(resolve(__dirname, 'ai-runtime.ts'), 'utf8');

  it('python agent routes accept snake_case knowledge/context keys only', () => {
    expect(agentsPy).toContain('data.get("related_resources")');
    expect(agentsPy).toContain('data.get("indexed_resources")');
    expect(agentsPy).toContain('data.get("analytics_context")');
    expect(agentsPy).toContain('data.get("context_errors")');
    expect(agentsPy).toContain('data.get("provider_config")');
    expect(agentsPy).not.toContain('data.get("relatedResources")');
    expect(agentsPy).not.toContain('data.get("indexedResources")');
    expect(agentsPy).not.toContain('data.get("analyticsContext")');
    expect(agentsPy).not.toContain('data.get("contextErrors")');
    expect(agentsPy).not.toContain('data.get("providerConfig")');
    expect(agentsPy).not.toContain('"apiKey": "api_key"');
    expect(agentsPy).not.toContain('taskDashboard');
  });

  it('ts runtime patches only snake_case context keys', () => {
    expect(aiRuntime).toContain("inputPatch['related_resources']");
    expect(aiRuntime).toContain("inputPatch['analytics_context']");
    expect(aiRuntime).toContain("inputPatch['context_errors']");
    expect(aiRuntime).toContain("!req.input['related_resources']");
    expect(aiRuntime).toContain("!req.input['analytics_context']");
    expect(aiRuntime).not.toContain("req.input['analyticsContext']");
    expect(aiRuntime).not.toContain("req.input['relatedNotes']");
  });
});
