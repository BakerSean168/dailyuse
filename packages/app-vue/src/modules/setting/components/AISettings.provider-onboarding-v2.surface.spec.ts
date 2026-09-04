import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AISettings Provider onboarding V2 surface', () => {
  const source = readFileSync(resolve(__dirname, 'AISettings.vue'), 'utf8');

  it('removes the Quick Provider/template bootstrap path', () => {
    expect(source).not.toContain('AI_PROVIDER_TEMPLATES');
    expect(source).not.toContain('submitQuickProvider');
    expect(source).not.toContain('quickProvider');
  });

  it('uses the four-step onboarding flow and opaque commit handle', () => {
    expect(source).toContain("type OnboardingStep = 'picker' | 'connection' | 'model' | 'review'");
    expect(source).toContain('probeProviderConnection');
    expect(source).toContain('testProviderOnboardingModel');
    expect(source).toContain('commitProviderOnboarding');
    expect(source).toContain('onboardingId: probeResult.value.onboardingId');
  });

  it('clears the raw API key immediately after a successful probe', () => {
    const probeBlock = source.slice(source.indexOf('async function probeConnection()'), source.indexOf('function selectModel'));
    expect(probeBlock).toContain("connectionApiKey.value = ''");
    expect(probeBlock.indexOf("connectionApiKey.value = ''")).toBeGreaterThan(probeBlock.indexOf('await probeProviderConnection'));
  });

  it('ranks recommendations without auto-selecting one as the persisted default', () => {
    expect(source).toContain('recommendedModelIds');
    expect(source).not.toMatch(/selectedModelId\.value\s*=\s*.*recommendedModelIds/);
    expect(source).toContain('@click="selectModel(model.id)"');
  });
});
