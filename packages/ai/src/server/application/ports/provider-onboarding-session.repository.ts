import type {
  AIModelInfo,
  AIProviderCatalogId,
  ProbeAIProviderConnectionRes,
} from '@memoflow/contracts/ai';

export type AIProviderOnboardingCredentialStatus = ProbeAIProviderConnectionRes['credential']['status'];
export type AIProviderOnboardingDiscoveryStatus = ProbeAIProviderConnectionRes['discovery']['status'];

export interface AIProviderOnboardingSessionRecord {
  readonly id: string;
  readonly identityId: string;
  readonly catalogId: AIProviderCatalogId;
  readonly baseUrl: string;
  /** Server-only plaintext after repository decryption. Never expose to transport DTOs. */
  readonly apiKey: string;
  readonly credentialStatus: AIProviderOnboardingCredentialStatus;
  readonly discoveryStatus: AIProviderOnboardingDiscoveryStatus;
  readonly models: readonly AIModelInfo[];
  readonly verifiedModelIds: readonly string[];
  readonly expiresAt: number;
  readonly consumedAt: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CreateAIProviderOnboardingSessionInput {
  readonly id: string;
  readonly identityId: string;
  readonly catalogId: AIProviderCatalogId;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly credentialStatus: AIProviderOnboardingCredentialStatus;
  readonly discoveryStatus: AIProviderOnboardingDiscoveryStatus;
  readonly models: readonly AIModelInfo[];
  readonly expiresAt: number;
  readonly now: number;
}

export interface IAIProviderOnboardingSessionRepository {
  create(input: CreateAIProviderOnboardingSessionInput): Promise<void>;
  findUsable(identityId: string, onboardingId: string, now: number): Promise<AIProviderOnboardingSessionRecord | null>;
  markModelVerified(input: {
    identityId: string;
    onboardingId: string;
    modelId: string;
    now: number;
  }): Promise<AIProviderOnboardingSessionRecord | null>;
  markConsumed(input: {
    identityId: string;
    onboardingId: string;
    now: number;
  }): Promise<boolean>;
}
