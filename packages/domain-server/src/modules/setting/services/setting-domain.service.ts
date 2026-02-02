/**
 * Setting Domain Service (示例实现)
 * 展示如何使用 Registry 来实现业务逻辑
 * 
 * 这个文件应该放在 packages/domain-server/src/modules/setting/services/
 */

import { SETTING_REGISTRY, validateSettingValue, SettingCategory } from '@/contracts';

/**
 * Setting 域服务
 * 负责管理用户设置的业务逻辑
 */
export class SettingDomainService {
  /**
   * 验证并更新设置值
   * 这是核心业务逻辑：确保没有非法值进入系统
   */
  validateAndUpdate(
    key: string,
    value: any
  ): { success: boolean; error?: string; value?: any } {
    // 1. 检查 Key 是否存在
    const meta = SETTING_REGISTRY[key];
    if (!meta) {
      return { success: false, error: `Unknown setting key: ${key}` };
    }

    // 2. 验证值
    const validation = validateSettingValue(key, value);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 3. 业务规则检查
    // 例：如果改变了 task.startOfWeek，需要调整所有日期索引
    if (key === 'task.startOfWeek') {
      // 发出事件：周起始日改变，需要重新计算任务日期
      // this.eventBus.publish(new TaskWeekStartChangedEvent(value));
    }

    // 例：如果禁用所有通知，需要关闭所有通知渠道
    if (key === 'notification.muteAll' && value === true) {
      // this.eventBus.publish(new AllNotificationsMutedEvent());
    }

    return { success: true, value };
  }

  /**
   * 批量更新设置
   */
  validateAndUpdateBatch(
    updates: Array<{ key: string; value: any }>
  ): { success: boolean; errors: Map<string, string>; validUpdates: Array<{ key: string; value: any }> } {
    const errors = new Map<string, string>();
    const validUpdates: Array<{ key: string; value: any }> = [];

    for (const { key, value } of updates) {
      const result = this.validateAndUpdate(key, value);
      if (result.success) {
        validUpdates.push({ key, value: result.value });
      } else {
        errors.set(key, result.error!);
      }
    }

    return { success: errors.size === 0, errors, validUpdates };
  }

  /**
   * 获取设置值（带默认值保护）
   */
  getValueOrDefault(key: string, fallback?: any): any {
    const meta = SETTING_REGISTRY[key];
    if (!meta) {
      throw new Error(`Unknown setting key: ${key}`);
    }

    // 这里应该从数据库获取，如果没有则返回默认值
    // const value = await this.repository.getValue(key);
    // return value ?? meta.defaultValue;

    return fallback ?? meta.defaultValue;
  }

  /**
   * 恢复默认设置
   */
  getDefaults(keys?: string[]): Record<string, any> {
    const result: Record<string, any> = {};

    if (!keys || keys.length === 0) {
      // 返回所有默认值
      for (const [key, meta] of Object.entries(SETTING_REGISTRY)) {
        result[key] = meta.defaultValue;
      }
    } else {
      // 返回指定 Key 的默认值
      for (const key of keys) {
        const meta = SETTING_REGISTRY[key];
        if (meta) {
          result[key] = meta.defaultValue;
        }
      }
    }

    return result;
  }

  /**
   * 获取指定分类的所有设置
   */
  getByCategory(category: SettingCategory): Array<{ key: string; value: any; metadata: typeof SETTING_REGISTRY[string] }> {
    const result: Array<{ key: string; value: any; metadata: typeof SETTING_REGISTRY[string] }> = [];

    for (const [key, meta] of Object.entries(SETTING_REGISTRY)) {
      if (meta.category === category) {
        result.push({
          key,
          value: this.getValueOrDefault(key), // 从数据库获取，或使用默认值
          metadata: meta,
        });
      }
    }

    return result;
  }

  /**
   * 检查设置是否可同步
   */
  isSyncable(key: string): boolean {
    const meta = SETTING_REGISTRY[key];
    return meta?.isSyncable ?? false;
  }

  /**
   * 获取所有可同步的设置
   */
  getSyncableSettings(): string[] {
    return Object.entries(SETTING_REGISTRY)
      .filter(([_, meta]) => meta.isSyncable)
      .map(([key]) => key);
  }

  /**
   * 应用场景：当某个关键设置改变时，需要触发其他模块的反应
   * 这就是为什么 Setting 模块需要发出领域事件
   */
  onSettingChanged(key: string, newValue: any, oldValue: any): void {
    // 主题改变 → 前端需要更新 CSS 变量
    if (key === 'appearance.theme') {
      // this.eventBus.publish(new ThemeChangedEvent(newValue));
    }

    // 禁用通知 → 通知模块需要停止发送
    if (key === 'notification.muteAll') {
      // this.eventBus.publish(new NotificationMutedStatusChangedEvent(newValue));
    }

    // 语言改变 → 需要重新加载语言包
    if (key === 'system.language') {
      // this.eventBus.publish(new LanguageChangedEvent(newValue));
    }

    // 时区改变 → 需要重新计算所有时间显示
    if (key === 'system.timezone') {
      // this.eventBus.publish(new TimezoneChangedEvent(newValue));
    }
  }
}
