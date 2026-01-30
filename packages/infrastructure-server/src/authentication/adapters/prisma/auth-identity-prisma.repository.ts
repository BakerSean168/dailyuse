import { PrismaClient } from '@prisma/client';
import { eventBus } from '@dailyuse/utils'; // 你的 EventBus 接口
import { 
  AuthIdentityRepository 
} from '@dailyuse/domain-server/authentication';
import { 
  AuthIdentity 
} from '@dailyuse/domain-server/authentication';
import { AuthIdentityMapper } from '../mappers/auth-identity.mapper';
import { CredentialType } from '@dailyuse/contracts/authentication';

export class PrismaAuthIdentityRepository implements AuthIdentityRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventBus: any,
  ) {}

  /**
   * ✅ 核心保存方法
   * 包含：事务、数据转换、关联更新、事件发送
   */
  async save(aggregate: AuthIdentity): Promise<void> {
    const { dto, identityData } = AuthIdentityMapper.toPersistence(aggregate);
    
    // 提取事件 (在事务开始前提取，防止副作用)
    const events = aggregate.pullDomainEvents();

    await this.prisma.$transaction(async (tx) => {
      // 1. 处理 Identity 和 Credentials
      // 使用 upsert 保证幂等性
      await tx.authIdentity.upsert({
        where: { id: dto.id },
        create: {
          ...identityData,
          credentials: {
            create: dto.credentials.map(cred => this.mapCredentialToPrismaInput(cred))
          }
        },
        update: {
          ...identityData,
          credentials: {
            // 策略：对每个凭证进行 Upsert
            upsert: dto.credentials.map(cred => ({
              where: { id: cred.id },
              create: this.mapCredentialToPrismaInput(cred),
              update: this.mapCredentialToPrismaInput(cred),
            })),
            // 如果有删除凭证的需求，这里需要 deleteMany 逻辑，
            // 但通常凭证只会被标记 REVOKED 而不是物理删除
          }
        }
      });

      // 2. 隐式发送领域事件
      // 放在事务内，如果发消息中间件失败，可以选择回滚 DB，或者记入 Outbox 表
      for (const event of events) {
        await this.eventBus.publish(event.eventType, event.payload);
      }
    });
  }

  /**
   * 🔍 根据 ID 查找
   */
  async findById(id: string): Promise<AuthIdentity | null> {
    const row = await this.prisma.authIdentity.findUnique({
      where: { id },
      include: { credentials: true }, // 必须 Include 关联
    });
    if (!row) return null;
    return AuthIdentityMapper.toDomain(row);
  }

  /**
   * 🔍 根据邮箱查找 (查 credentials 表反向推导)
   */
  async findByEmail(email: string): Promise<AuthIdentity | null> {
    // 先找凭证
    const credential = await this.prisma.authCredential.findFirst({
      where: {
        identifier: email,
        type: 'PASSWORD', // 确保是密码类型的凭证
      },
      select: { identityId: true }
    });

    if (!credential) return null;

    // 再找聚合根
    return this.findById(credential.identityId);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.authCredential.count({
      where: {
        identifier: email,
        type: 'PASSWORD',
      }
    });
    return count > 0;
  }

  // ================= 私有辅助 =================

  /**
   * 将 DTO 里的凭证转为 Prisma 的 Input 格式
   * 处理稀疏列映射
   */
  private mapCredentialToPrismaInput(credDto: any) {
    // 公共字段
    const base = {
      id: credDto.id,
      type: credDto.type as any,
      status: credDto.status as any,
      lastUsedAt: credDto.lastUsedAt,
      // 显式设置不相关的字段为 null (虽然 Prisma update 时 undefined 不会更新，但 create 需要)
      identifier: null,
      passwordHash: null,
      provider: null,
      providerSubjectId: null,
      accessToken: null,
      refreshToken: null,
      oauthExpiresAt: null,
    };

    if (credDto.type === CredentialType.PASSWORD) {
      return {
        ...base,
        identifier: credDto.identifier, // email
        passwordHash: credDto.passwordHash,
      };
    }

    if (credDto.type === CredentialType.OAUTH) {
      return {
        ...base,
        provider: credDto.provider,
        providerSubjectId: credDto.providerSubjectId,
        accessToken: credDto.accessToken,
        refreshToken: credDto.refreshToken,
        oauthExpiresAt: credDto.expiresAt,
      };
    }

    // PHONE ...
    return base;
  }
}