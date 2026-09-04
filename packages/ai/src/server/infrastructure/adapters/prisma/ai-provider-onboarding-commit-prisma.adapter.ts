import type { Prisma, PrismaClient } from '@memoflow/database';
import type { IAIProviderOnboardingCommitPort } from '../../../application/ports/provider-onboarding-commit.port';
import type { IAIProviderSecretVault } from '../../../application/ports/provider-secret-vault.port';
import { AISecretCipher } from '../../security/ai-secret-cipher';

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

  async commit(input: Parameters<IAIProviderOnboardingCommitPort['commit']>[0]) {
    try {
      return await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
        const consumed = await tx.aiProviderOnboardingSession.updateMany({
          where: {
            id: input.onboardingId,
            identityId: input.identityId,
            consumedAt: null,
            expiresAt: { gt: new Date(input.now) },
          },
          data: { consumedAt: new Date(input.now), updatedAt: new Date(input.now) },
        });
        if (consumed.count !== 1) return 'SESSION_UNAVAILABLE' as const;

        if (input.provider.isDefault) {
          await tx.$queryRawUnsafe(
            'SELECT pg_advisory_xact_lock(hashtext($1))',
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
            // V2 no longer treats the full provider inventory as aggregate truth.
            availableModels: '[]',
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
      if (isUniqueConstraintError(error)) return 'CONFLICT' as const;
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
