import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { PrismaUserSettingRepository } from '../repositories/PrismaUserSettingRepository';
import { prisma } from '@/shared/infrastructure/config/prisma';

/**
 * Setting 模块依赖注入容器
 * 负责管理领域服务和仓储的实例创建和生命周期
 *
 * 采用懒加载模式：
 * - 只在首次调用时创建实例
 * - 后续调用返回已有实例（单例）
 *
 * 支持测试替换：
 * - 允许注入 Mock 仓储用于单元测试
 */
export class SettingContainer {
  private static instance: SettingContainer;
  private userSettingRepository?: IUserSettingRepository;

  private constructor() {}

  static getInstance(): SettingContainer {
    if (!SettingContainer.instance) {
      SettingContainer.instance = new SettingContainer();
    }
    return SettingContainer.instance;
  }

  /**
   * 获取用户设置仓储实例（懒加载）
   */
  getUserSettingRepository(): IUserSettingRepository {
    if (!this.userSettingRepository) {
      this.userSettingRepository = new PrismaUserSettingRepository(prisma);
    }
    return this.userSettingRepository;
  }

  /**
   * 设置用户设置仓储实例（用于测试）
   */
  setUserSettingRepository(repository: IUserSettingRepository): void {
    this.userSettingRepository = repository;
  }

  /**
   * 重置容器（用于测试）
   */
  reset(): void {
    this.userSettingRepository = undefined;
  }
}
