import type { AIProviderConfigServerDTO } from '@memoflow/contracts/ai';

export type AIProviderOnboardingCommitOutcome = 'COMMITTED' | 'SESSION_UNAVAILABLE' | 'CONFLICT';

/**
 * Atomic persistence boundary for the final onboarding commit.
 * Implementations must consume the one-time session and create the Provider in
 * one transaction, or roll both actions back.
 */
export interface IAIProviderOnboardingCommitPort {
  commit(input: {
    identityId: string;
    onboardingId: string;
    provider: AIProviderConfigServerDTO;
    now: number;
  }): Promise<AIProviderOnboardingCommitOutcome>;
}
