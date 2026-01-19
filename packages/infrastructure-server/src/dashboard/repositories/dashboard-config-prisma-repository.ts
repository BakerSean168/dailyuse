/**
 * @file DashboardConfigPrismaRepository.ts
 * @description 仪表板配置 Prisma 仓储实现。
 * @date 2025-01-22
 */

import type { PrismaClient } from '@prisma/client';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import type { DashboardConfigServerDTO, WidgetConfigDTO, DashboardConfigPersistenceDTO } from '@dailyuse/contracts/dashboard';

/**
 * Dashboard 配置仓储 Prisma 实现类。
 *
 * @remarks
 * 负责 DashboardConfig 聚合根的持久化操作。
 * 处理 JSON 字段（widgetConfig）的序列化。
 */
export class DashboardConfigPrismaRepository implements IDashboardConfigRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 根据账户 UUID 查找配置。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<DashboardConfig | null>} 配置实体或 null
   */
  async findByAccountUuid(accountUuid: string): Promise<DashboardConfig | null> {
    const config = await this.prisma.dashboardConfig.findUnique({
      where: { accountUuid },
    });

    if (!config) {
      return null;
    }

    // 转换为 Persistence DTO，然后创建聚合根
    const persistenceDTO: DashboardConfigPersistenceDTO = {
      id: config.id,
      accountUuid: config.accountUuid,
      widgetConfig: JSON.stringify(config.widgetConfig),
      createdAt: config.createdAt.getTime(),
      updatedAt: config.updatedAt.getTime(),
    };

    return DashboardConfig.fromPersistence(persistenceDTO);
  }

  /**
   * 保存配置。
   *
   * @param config - 配置实体
   * @returns {Promise<DashboardConfig>} 更新后的实体
   */
  async save(config: DashboardConfig): Promise<DashboardConfig> {
    const persistenceDTO = config.toPersistence();

    // 尝试更新，如果不存在则创建
    const result = await this.prisma.dashboardConfig.upsert({
      where: { accountUuid: config.accountUuid },
      create: {
        accountUuid: persistenceDTO.accountUuid,
        widgetConfig: JSON.parse(persistenceDTO.widgetConfig),
      },
      update: {
        widgetConfig: JSON.parse(persistenceDTO.widgetConfig),
      },
    });

    // 重新从数据库加载以获取最新状态
    const updatedPersistenceDTO: DashboardConfigPersistenceDTO = {
      id: result.id,
      accountUuid: result.accountUuid,
      widgetConfig: JSON.stringify(result.widgetConfig),
      createdAt: result.createdAt.getTime(),
      updatedAt: result.updatedAt.getTime(),
    };

    return DashboardConfig.fromPersistence(updatedPersistenceDTO);
  }

  /**
   * 删除配置。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<void>}
   */
  async delete(accountUuid: string): Promise<void> {
    await this.prisma.dashboardConfig.delete({
      where: { accountUuid },
    });
  }

  /**
   * 检查配置是否存在。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.dashboardConfig.count({
      where: { accountUuid },
    });
    return count > 0;
  }
}
