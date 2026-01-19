import type { PrismaClient } from '@prisma/client';
import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { UserSetting } from '@dailyuse/domain-server/setting';
import type { Prisma } from '@prisma/client';

/**
 * Prisma UserSetting Repository
 * 
 * 使用 DDD 最佳实践：将整个 UserSetting 聚合序列化为 JSON 存储在 account.settings 字段
 * 
 * 优势：
 * 1. 灵活的 Schema：无需数据库迁移即可添加新设置
 * 2. 原子性：整个聚合作为单一事务边界
 * 3. 版本控制：可以在 JSON 中包含版本号
 * 4. 简化查询：一次查询获取所有设置
 */
export class PrismaUserSettingRepository implements IUserSettingRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 根据账户UUID查找用户设置
   */
  async findByAccountUuid(accountUuid: string): Promise<UserSetting | null> {
    try {
      const account = await this.prisma.account.findUnique({
        where: { uuid: accountUuid },
        select: { settings: true },
      });

      if (!account) {
        return null;
      }

      // 如果是空对象或没有设置，返回 null，让上层创建默认设置
      if (!account.settings || Object.keys(account.settings).length === 0) {
        return null;
      }

      // 从 JSON 对象反序列化为 UserSetting 聚合
      const settingsData = account.settings as Prisma.JsonObject;
      return UserSetting.fromServerDTO(settingsData as any);
    } catch (error) {
      console.error('[PrismaUserSettingRepository] Error in findByAccountUuid:', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      // 如果解析失败，返回 null 让上层创建默认设置
      return null;
    }
  }

  /**
   * 保存用户设置
   * 将整个 UserSetting 聚合序列化为 JSON 并存储
   */
  async save(setting: UserSetting): Promise<void> {
    const serverDTO = setting.toServerDTO();
    
    // 将 ServerDTO 转换为 Prisma 的 JsonValue 类型
    const settingsJson: Prisma.JsonObject = serverDTO as any;

    await this.prisma.account.update({
      where: { uuid: setting.accountUuid },
      data: {
        settings: settingsJson,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 删除用户设置
   * 将 settings 字段设置为空对象
   */
  async delete(accountUuid: string): Promise<void> {
    await this.prisma.account.update({
      where: { uuid: accountUuid },
      data: {
        settings: {},
        updatedAt: new Date(),
      },
    });
  }
}
