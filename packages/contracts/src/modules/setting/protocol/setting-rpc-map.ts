/**
 * Setting Module RPC Protocol Map
 * 设置模块的 RPC 接口定义
 */
import type { SettingEntryDTO, SettingListDTO, UpdateSettingsRequestDTO, ResetSettingsRequestDTO, GetSettingsByCategoryRequestDTO, SettingsExportDTO } from '../dtos/setting-entry.dto';
import type { SettingCategory } from '../registry';

export type SettingRpcMap = {
  /**
   * 获取所有用户的云端同步设置
   */
  'setting.get-all': [
    void,
    SettingListDTO
  ];

  /**
   * 获取指定分类的设置
   */
  'setting.get-by-category': [
    GetSettingsByCategoryRequestDTO,
    SettingEntryDTO[]
  ];

  /**
   * 获取单个设置值
   */
  'setting.get-one': [
    { key: string },
    SettingEntryDTO | null
  ];

  /**
   * 批量更新设置
   */
  'setting.update-batch': [
    UpdateSettingsRequestDTO,
    void
  ];

  /**
   * 更新单个设置
   */
  'setting.update-one': [
    { key: string; value: any },
    void
  ];

  /**
   * 恢复默认设置
   */
  'setting.reset-to-defaults': [
    ResetSettingsRequestDTO,
    void
  ];

  /**
   * 导出设置（用于备份）
   */
  'setting.export': [
    void,
    SettingsExportDTO
  ];

  /**
   * 导入设置（用于恢复备份）
   */
  'setting.import': [
    { export: SettingsExportDTO },
    void
  ];

  /**
   * 获取设置变更历史
   */
  'setting.get-history': [
    { key: string; limit?: number },
    Array<{
      key: string;
      oldValue: any;
      newValue: any;
      changedAt: string;
    }>
  ];

  /**
   * 订阅设置变更事件（WebSocket）
   */
  'setting.subscribe-changes': [
    void,
    void // 返回事件流
  ];
};
