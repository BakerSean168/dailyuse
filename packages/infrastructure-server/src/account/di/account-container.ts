import type { IAccountRepository } from '@dailyuse/domain-server/account';
import { PrismaAccountRepository } from '../repositories/prisma-account.repository';
import { prisma } from '@/shared/infrastructure/config/prisma';

/**
 * Account 模块依赖注入容器
 * 负责管理领域服务和仓储的实例创建和生命周期
 *
 * 采用懒加载模式：
 * - 只在首次调用时创建实例
 * - 后续调用返回已有实例（单例）
 *
 * 支持测试替换：
 * - 允许注入 Mock 仓储用于单元测试
 */
export class AccountContainer {
  private static instance: AccountContainer;
  private accountRepository?: IAccountRepository;

  private constructor() {}

  static getInstance(): AccountContainer {
    if (!AccountContainer.instance) {
      AccountContainer.instance = new AccountContainer();
    }
    return AccountContainer.instance;
  }

  /**
   * 获取账户仓储实例（懒加载）
   */
  getAccountRepository(): IAccountRepository {
    if (!this.accountRepository) {
      this.accountRepository = new PrismaAccountRepository(prisma);
    }
    return this.accountRepository;
  }

  /**
   * 设置账户仓储实例（用于测试）
   */
  setAccountRepository(repository: IAccountRepository): void {
    this.accountRepository = repository;
  }

  /**
   * 重置容器（用于测试）
   */
  reset(): void {
    this.accountRepository = undefined;
  }
}
