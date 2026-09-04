import type { Prisma, PrismaClient } from '@memoflow/database';
import type {
  AIProviderOnboardingCommitOutcome,
  AIProviderReplacementCommitOutcome,
  IAIProviderOnboardingCommitPort,
} from '../../../application/ports/provider-onboarding-commit.port';
import type { IAIProviderSecretVault } from '../../../application/ports/provider-secret-vault.port';
import { AISecretCipher } from '../../security/ai-secret-cipher';

class ReplacementRollback extends Error {
  constructor(readonly outcome: AIProviderReplacementCommitOutcome) {
    super(outcome);
  }
}

export class AIProviderOnboardingCommitPrismaAdapter implements IAIProviderOnboardingCommitPort {
  private cipher: IAIProviderSecretVault | null;

  constructor(
    private readonly db: PrismaClient,
    secretVault?: IAIProviderSecretVault,
  ) {
    this.cipher = secretVault ?? null;
  }

  private get secretVault(): IAIProviderSecretVault {
    return (this.cipher ??= AISecretCipher.fromEnv());
  }

  async commit(
    input: Parameters<IAIProviderOnboardingCommitPort['commit']>[0],
  ): Promise<AIProviderOnboardingCommitOutcome> {
    try {
      return await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
        const consumed = await tx.aiProviderOnboardingSession.updateMany({
          where: {
            id: input.onboardingId,
            identityId: input.identityId,
            targetProviderId: null,
            consumedAt: null,
            expiresAt: { gt: new Date(input.now) },
          },
          data: { consumedAt: new Date(input.now), updatedAt: new Date(input.now) },
        });
        if (consumed.count !== 1) return 'SESSION_UNAVAILABLE' as const;

        if (input.provider.isDefault) {
          await tx.$queryRawUnsafe(
            'SELECT pg_advisory_xact_lock(hashtext($1))::text AS acquired',
            input.identityId,
          );
          await tx.aiProviderConfig.updateMany({
            where: { identityId: input.identityId, deletedAt: null },
            data: { isDefault: false },
          });
        }

        await tx.aiProviderConfig.create({
          data: {
            id: String(input.provider.id),
            identityId: input.identityId,
            name: input.provider.name,
            providerType: input.provider.providerType,
            baseUrl: input.provider.baseUrl,
            apiKeyEncrypted: this.secretVault.encrypt(input.provider.apiKey),
            defaultModel: input.provider.defaultModel,
            isActive: input.provider.isActive,
            isDefault: input.provider.isDefault,
            priority: input.provider.priority,
            version: input.provider.version,
            createdAt: new Date(input.provider.createdAt),
            updatedAt: new Date(input.provider.updatedAt),
            deletedAt: null,
          },
        });
        return 'COMMITTED' as const;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) return 'CONFLICT';
      throw error;
    }
  }

  async replace(
    input: Parameters<IAIProviderOnboardingCommitPort['replace']>[0],
  ): Promise<AIProviderReplacementCommitOutcome> {
    if (
      String(input.replacement.id) !== input.targetProviderId ||
      String(input.replacement.identityId) !== input.identityId
    ) {
      return 'SESSION_UNAVAILABLE';
    }

    try {
      return await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
        const current = await tx.aiProviderConfig.findFirst({
          where: {
            id: input.targetProviderId,
            identityId: input.identityId,
            deletedAt: null,
          },
          select: { version: true },
        });
        if (!current) return 'PROVIDER_NOT_FOUND' as const;
        if (current.version !== input.expectedVersion) return 'CONFLICT' as const;

        const consumed = await tx.aiProviderOnboardingSession.updateMany({
          where: {
            id: input.onboardingId,
            identityId: input.identityId,
            targetProviderId: input.targetProviderId,
            consumedAt: null,
            expiresAt: { gt: new Date(input.now) },
          },
          data: { consumedAt: new Date(input.now), updatedAt: new Date(input.now) },
        });
        if (consumed.count !== 1) return 'SESSION_UNAVAILABLE' as const;

        const updated = await tx.aiProviderConfig.updateMany({
          where: {
            id: input.targetProviderId,
            identityId: input.identityId,
            deletedAt: null,
            version: input.expectedVersion,
          },
          data: {
            baseUrl: input.replacement.baseUrl,
            apiKeyEncrypted: this.secretVault.encrypt(input.replacement.apiKey),
            defaultModel: input.replacement.defaultModel,
            version: input.replacement.version,
            updatedAt: new Date(input.replacement.updatedAt),
          },
        });
        if (updated.count !== 1) {
          // Throw rather than return: the session consume above must roll back too.
          throw new ReplacementRollback('CONFLICT');
        }
        return 'REPLACED' as const;
      });
    } catch (error) {
      if (error instanceof ReplacementRollback) return error.outcome;
      throw error;
    }
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002',
  );
}
