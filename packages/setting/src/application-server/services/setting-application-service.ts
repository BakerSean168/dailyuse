// @ts-nocheck
import type { IUserSettingRepository } from '@/domain-server';
import { UserSetting } from '@/domain-server';
import type { UserSettingServerDTO, UpdateUserSettingDTO } from '@dailyuse/contracts/setting'; // Added UpdateUserSettingDTO import explicitly if needed or inferred
import type { UserSettingDTO } from '@dailyuse/contracts/setting'; // Fix DTO type name matching usage

/**
 * Setting 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain → ClientDTO）
 * - 调用 Repository 进行持久化
 *
 * 注意：返回给客户端的数据必须使用 ClientDTO（通过 toClientDTO() 方法）
 */
export class SettingApplicationService {
  private userSettingRepository: IUserSettingRepository;

  constructor(userSettingRepository: IUserSettingRepository) {
    this.userSettingRepository = userSettingRepository;
  }

  // ===== UserSetting CRUD 操作 =====

  /**
   * 获取用户设置（如果不存在则创建默认设置）
   */
  async getUserSetting(accountUuid: string): Promise<UserSettingDTO> {
    let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      // 首次访问，创建默认设置
      setting = UserSetting.create({ accountUuid });
      await this.userSettingRepository.save(setting);
    }

    return setting.toClientDTO();
  }

  /**
   * 更新用户设置
   */
  async updateUserSetting(
    accountUuid: string,
    updates: UpdateUserSettingDTO,
  ): Promise<UserSettingDTO> {
    let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      // 如果设置不存在，先创建默认设置
      setting = UserSetting.create({ accountUuid });
    }

    // 更新各个设置分类
    if (updates.appearance) {
      setting.updateAppearance(updates.appearance);
    }
    if (updates.locale) {
      setting.updateLocale(updates.locale);
    }
    if (updates.workflow) {
      setting.updateWorkflow(updates.workflow);
    }
    if (updates.privacy) {
      setting.updatePrivacy(updates.privacy);
    }
    if (updates.shortcuts) {
      // shortcuts 需要特殊处理
      if (updates.shortcuts.custom) {
        for (const [action, shortcut] of Object.entries(updates.shortcuts.custom)) {
          setting.updateShortcut(action, shortcut as string);
        }
      }
    }
    if (updates.experimental) {
      // experimental 需要特殊处理
      if (updates.experimental.features) {
        for (const feature of updates.experimental.features) {
          setting.enableExperimentalFeature(feature);
        }
      }
    }

    await this.userSettingRepository.save(setting);
    return setting.toClientDTO();
  }

  /**
   * 重置用户设置为默认值
   */
  async resetUserSetting(accountUuid: string): Promise<UserSettingDTO> {
    const setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      throw new Error('User setting not found');
    }

    // 删除现有设置，创建新的默认设置
    const newSetting = UserSetting.create({ accountUuid });
    // 保留原 UUID
    (newSetting as any)._uuid = setting.uuid;
    
    await this.userSettingRepository.save(newSetting);
    return newSetting.toClientDTO();
  }

  /**
   * 获取默认设置
   */
  async getDefaultSettings(): Promise<UserSettingClientDTO> {
    const defaultSetting = UserSetting.create({ accountUuid: 'temp-uuid' });
    return defaultSetting.toClientDTO();
  }

  // ===== 导入/导出功能 =====

  /**
   * 导出用户设置为 JSON 对象
   * 用于备份、迁移或分享配置
   */
  async exportSettings(accountUuid: string): Promise<Record<string, any>> {
    const setting = await this.userSettingRepository.findByAccountUuid(accountUuid);

    if (!setting) {
      throw new Error('User setting not found');
    }

    const dto = setting.toServerDTO();
    
    // 添加导出元数据
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      accountUuid: accountUuid,
      settings: dto,
    };
  }

  /**
   * 导入用户设置
   * 支持从导出的 JSON 对象恢复配置
   * 
   * @param accountUuid 要导入设置的账户 UUID
   * @param data 导出的设置数据
   * @param options 导入选项
   */
  async importSettings(
    accountUuid: string,
    data: Record<string, any>,
    options?: {
      merge?: boolean; // 是否合并现有设置（默认：false，完全替换）
      validate?: boolean; // 是否验证数据（默认：true）
    },
  ): Promise<UserSettingDTO> {
    const { merge = false, validate = true } = options || {};

    // 验证导入数据格式
    if (validate) {
      this.validateImportData(data);
    }

    const importedSettings = data.settings;

    if (merge) {
      // 合并模式：更新现有设置
      return await this.updateUserSetting(accountUuid, importedSettings);
    } else {
      // 替换模式：完全替换现有设置
      let setting = await this.userSettingRepository.findByAccountUuid(accountUuid);
      
      if (!setting) {
        setting = UserSetting.create({ accountUuid });
      }

      // 从导入的数据重建设置
      const newSetting = UserSetting.fromServerDTO({
        ...importedSettings,
        accountUuid: accountUuid, // 确保使用当前账户的 UUID
        uuid: setting.uuid, // 保留原 UUID
      });

      await this.userSettingRepository.save(newSetting);
      return newSetting.toClientDTO();
    }
  }

  /**
   * 验证导入数据的格式
   */
  private validateImportData(data: Record<string, any>): void {
    // 检查必需字段
    if (!data.settings) {
      throw new Error('Invalid import data: missing settings field');
    }

    if (!data.version) {
      throw new Error('Invalid import data: missing version field');
    }

    // 检查版本兼容性
    const supportedVersions = ['1.0.0'];
    if (!supportedVersions.includes(data.version)) {
      throw new Error(`Unsupported settings version: ${data.version}`);
    }

    // 基本结构验证
    const settings = data.settings;
    const requiredFields = ['appearance', 'locale', 'workflow', 'privacy'];
    
    for (const field of requiredFields) {
      if (!settings[field]) {
        throw new Error(`Invalid import data: missing ${field} settings`);
      }
    }
  }
}




