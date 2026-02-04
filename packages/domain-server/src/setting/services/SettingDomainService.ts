/**
 * Setting Domain Service
 * 设置领域服务
 *
 * DDD 领域服务职责：
 * - 跨聚合根的业务逻辑
 * - 协调多个聚合根
 * - 使用仓储接口进行持久化
 * - 触发领域事件
 */

import type { ISettingRepository } from '../repositories/ISettingRepository';
import { Setting } from '../aggregates/Setting';
import type { ValidationRuleDTO, UIConfigDTO, SyncConfigDTO } from '@dailyuse/contracts/setting';
import type { SettingGroupId } from '@dailyuse/contracts/primitives';
import { SettingScope, SettingValueType } from '@dailyuse/contracts/setting';
import { ValidationRule, UIConfig, SyncConfig } from '@dailyuse/domain-shared/setting';

/**
 * SettingDomainService
 *
 * 注意：
 * - 通过构造函数注入仓储接口
 * - 不直接操作数据库
 * - 业务逻辑在聚合根/实体中，服务只是协调
 */
export class SettingDomainService {
  constructor(
    private readonly settingRepo: ISettingRepository,
    // 可以注入其他仓储或服务
    // private readonly eventBus: IEventBus,
  ) {}

  /**
   * 创建新的设置项
   */
  public async createSetting(params: {
    key: string;
    name: string;
    description?: string;
    valueType: SettingValueType;
    value: any;
    defaultValue: any;
    scope: SettingScope;
    accountUuid?: string;
    deviceId?: string;
    groupUuid?: string;
    validation?: ValidationRuleDTO;
    ui?: UIConfigDTO;
    isEncrypted?: boolean;
    isReadOnly?: boolean;
    isSystemSetting?: boolean;
    syncConfig?: SyncConfigDTO;
  }): Promise<Setting> {
    // 1. 验证：检查 key 是否已存在
    const exists = await this.settingRepo.existsByKey(
      params.key,
      params.scope,
      params.accountUuid || params.deviceId,
    );
    if (exists) {
      throw new Error(`Setting with key "${params.key}" already exists in scope ${params.scope}`);
    }

    // 2. 创建值对象
    const validation = params.validation
      ? ValidationRule.fromDTO(params.validation)
      : undefined;
    const ui = params.ui ? UIConfig.fromDTO(params.ui) : undefined;
    const syncConfig = params.syncConfig ? SyncConfig.fromDTO(params.syncConfig) : undefined;

    // 3. 创建聚合根
    const setting = Setting.create({
      key: params.key,
      name: params.name,
      description: params.description,
      valueType: params.valueType,
      value: params.value,
      defaultValue: params.defaultValue,
      scope: params.scope,
      accountId: params.accountUuid,
      deviceId: params.deviceId,
      groupId: params.groupUuid as SettingGroupId | undefined,
      validation,
      ui,
      isEncrypted: params.isEncrypted,
      isReadOnly: params.isReadOnly,
      isSystemSetting: params.isSystemSetting,
      syncConfig,
    });

    // 4. 持久化
    await this.settingRepo.save(setting);

    // 5. 触发领域事件
    // await this.eventBus.publish({
    //   type: 'setting.created',
    //   aggregateId: setting.uuid,
    //   timestamp: Date.now(),
    //   payload: { setting: setting.toServerDTO() },
    // });

    return setting;
  }

  /**
   * 获取设置项
   */
  public async getSetting(
    uuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting | null> {
    return await this.settingRepo.findById(uuid, options);
  }

  /**
   * 通过 key 获取设置
   */
  public async getSettingByKey(
    key: string,
    scope: SettingScope,
    contextUuid?: string,
  ): Promise<Setting | null> {
    return await this.settingRepo.findByKey(key, scope, contextUuid);
  }

  /**
   * 更新设置值
   */
  public async updateSettingValue(
    uuid: string,
    newValue: any,
    operatorUuid?: string,
  ): Promise<Setting> {
    // 1. 加载聚合根
    const setting = await this.settingRepo.findById(uuid);
    if (!setting) {
      throw new Error(`Setting not found: ${uuid}`);
    }

    // 2. 业务逻辑：验证并更新
    // Validation is performed inline since Setting doesn't have a validate method
    if (setting.validation) {
      // TODO: Implement validation logic using setting.validation
    }

    setting.setValue(newValue, operatorUuid);

    // 3. 持久化
    await this.settingRepo.save(setting);

    // 4. 触发领域事件
    // await this.eventBus.publish({
    //   type: 'setting.updated',
    //   aggregateId: setting.uuid,
    //   timestamp: Date.now(),
    //   payload: { setting: setting.toServerDTO() },
    // });

    return setting;
  }

  /**
   * 重置设置为默认值
   */
  public async resetSetting(uuid: string): Promise<Setting> {
    const setting = await this.settingRepo.findById(uuid);
    if (!setting) {
      throw new Error(`Setting not found: ${uuid}`);
    }

    setting.resetToDefault();
    await this.settingRepo.save(setting);

    return setting;
  }

  /**
   * 批量更新设置
   */
  public async updateManySettings(
    updates: Array<{ uuid: string; value: any; operatorUuid?: string }>,
  ): Promise<Setting[]> {
    const results: Setting[] = [];

    for (const update of updates) {
      const setting = await this.updateSettingValue(update.uuid, update.value, update.operatorUuid);
      results.push(setting);
    }

    return results;
  }

  /**
   * 同步设置到云端
   */
  public async syncSetting(uuid: string): Promise<void> {
    const setting = await this.settingRepo.findById(uuid);
    if (!setting) {
      throw new Error(`Setting not found: ${uuid}`);
    }

    // TODO: Implement sync logic using setting.syncConfig
    // Sync should be handled by external sync service

    // 更新同步状态
    await this.settingRepo.save(setting);
  }

  /**
   * 获取作用域内的所有设置
   */
  public async getSettingsByScope(
    scope: SettingScope,
    contextUuid?: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    return await this.settingRepo.findByScope(scope, contextUuid, options);
  }

  /**
   * 获取用户所有设置
   */
  public async getUserSettings(
    accountUuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    return await this.settingRepo.findUserSettings(accountUuid, options);
  }

  /**
   * 获取系统设置
   */
  public async getSystemSettings(options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return await this.settingRepo.findSystemSettings(options);
  }

  /**
   * 搜索设置
   */
  public async searchSettings(query: string, scope?: SettingScope): Promise<Setting[]> {
    return await this.settingRepo.search(query, scope);
  }

  /**
   * 删除设置（软删除）
   */
  public async deleteSetting(uuid: string): Promise<void> {
    const setting = await this.settingRepo.findById(uuid);
    if (!setting) {
      throw new Error(`Setting not found: ${uuid}`);
    }

    // 检查是否为系统设置
    if (setting.isSystemSetting) {
      throw new Error('Cannot delete system setting');
    }

    setting.delete();
    await this.settingRepo.save(setting);

    // 触发领域事件
    // await this.eventBus.publish({
    //   type: 'setting.deleted',
    //   aggregateId: setting.uuid,
    //   timestamp: Date.now(),
    // });
  }

  /**
   * 验证设置值
   */
  public async validateSettingValue(
    uuid: string,
    value: any,
  ): Promise<{ valid: boolean; error?: string }> {
    const setting = await this.settingRepo.findById(uuid);
    if (!setting) {
      throw new Error(`Setting not found: ${uuid}`);
    }

    // TODO: Implement validation logic using setting.validation
    // For now, return valid as default
    return { valid: true };
  }

  /**
   * 导出设置配置
   */
  public async exportSettings(
    scope: SettingScope,
    contextUuid?: string,
  ): Promise<Record<string, any>> {
    const settings = await this.settingRepo.findByScope(scope, contextUuid);

    const config: Record<string, any> = {};
    for (const setting of settings) {
      config[setting.key] = setting.value;
    }

    return config;
  }

  /**
   * 导入设置配置
   */
  public async importSettings(
    scope: SettingScope,
    config: Record<string, any>,
    contextUuid?: string,
    operatorUuid?: string,
  ): Promise<void> {
    for (const [key, value] of Object.entries(config)) {
      // 尝试查找现有设置
      const existing = await this.settingRepo.findByKey(key, scope, contextUuid);

      if (existing) {
        // 更新现有设置
        existing.setValue(value, operatorUuid);
        await this.settingRepo.save(existing);
      }
      // 如果不存在则忽略（或根据业务需求创建）
    }
  }
}
