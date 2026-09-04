import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AI Provider onboarding V2 HTTP route surface', () => {
  const routes = readFileSync(resolve(__dirname, 'ai-provider-onboarding.routes.ts'), 'utf8');
  const providerRoutes = readFileSync(resolve(__dirname, 'ai-provider.routes.ts'), 'utf8');

  it('exposes catalog, probe and model-test under the canonical /api/v1/ai paths', () => {
    expect(routes).toContain("basePath: '/api/v1/ai'");
    expect(routes).toContain("path: '/provider-catalog'");
    expect(routes).toContain("path: '/provider-connections/probe'");
    expect(routes).toContain("path: '/provider-connections/test-model'");
  });

  it('makes POST /providers V2-first while retaining the temporary legacy compatibility schema', () => {
    expect(providerRoutes).toContain('CommitAIProviderOnboardingSchema');
    expect(providerRoutes).toContain('CreateAIProviderConfigSchema');
    expect(providerRoutes).toContain('z.union([CommitAIProviderOnboardingSchema, CreateAIProviderConfigSchema])');
  });
});
