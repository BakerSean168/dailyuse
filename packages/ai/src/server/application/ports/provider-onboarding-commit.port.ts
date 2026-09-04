import type { AIProviderConfigServerDTO } from '@memoflow/contracts/ai';

export type AIProviderOnboardingCommitOutcome = 'COMMITTED' | 'SESSION_UNAVAILABLE' | 'CONFLICT';
export type AIProviderReplacementCommitOutcome =
  | 'REPLACED'
  | 'SESSION_UNAVAILABLE'
  | 'PROVIDER_NOT_FOUND'
  | 'CONFLICT';

/**
 * Atomic persistence boundary for Provider onboarding and connection replacement.
 * Implementations must consume the one-time session and persist the Provider
 * mutation in one transaction, or roll both actions back.
 */
export interface IAIProviderOnboardingCommitPort {
  commit(input: {
    identityId: string;
    onboardingId: string;
    provider: AIProviderConfigServerDTO;
    now: number;
  }): Promise<AIProviderOnboardingCommitOutcome>;

  replace(input: {
    identityId: string;
    onboardingId: string;
    targetProviderId: string;
    expectedVersion: number;
    replacement: AIProviderConfigServerDTO;
    now: number;
  }): Promise<AIProviderReplacementCommitOutcome>;
}
