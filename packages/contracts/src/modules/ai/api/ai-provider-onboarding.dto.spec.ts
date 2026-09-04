import {
  AI_PROVIDER_CATALOG,
  CommitAIProviderOnboardingSchema,
  ProbeAIProviderConnectionSchema,
} from '../index';

describe('AI Provider Onboarding V2 contracts', () => {
  it('keeps catalog recommendations separate from persisted default model selection', () => {
    expect(AI_PROVIDER_CATALOG).toHaveLength(5);
    expect(AI_PROVIDER_CATALOG.map((entry) => entry.id)).toEqual([
      'openrouter',
      'openai',
      'gemini',
      'deepseek',
      'custom',
    ]);
    for (const entry of AI_PROVIDER_CATALOG) {
      expect(entry).toHaveProperty('recommendedModelIds');
      expect(entry).not.toHaveProperty('defaultModel');
    }
  });

  it('probes a connection without requiring a model', () => {
    expect(
      ProbeAIProviderConnectionSchema.parse({
        catalogId: 'openrouter',
        apiKey: 'sk-test',
      }),
    ).toEqual({ catalogId: 'openrouter', apiKey: 'sk-test' });
  });

  it('commits only a one-time onboarding handle plus explicit model selection', () => {
    const parsed = CommitAIProviderOnboardingSchema.parse({
      onboardingId: 'onboarding_0123456789abcdef',
      name: 'My OpenRouter',
      defaultModelId: 'openai/gpt-4.1-mini',
      isDefault: true,
    });
    expect(parsed.defaultModelId).toBe('openai/gpt-4.1-mini');
    expect(parsed).not.toHaveProperty('apiKey');
    expect(parsed).not.toHaveProperty('baseUrl');
  });
});
