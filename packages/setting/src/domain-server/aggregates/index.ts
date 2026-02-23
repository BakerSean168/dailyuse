/**
 * Setting Aggregates
 * 设置模块聚合根导出
 *
 * 【UserSetting 聚合根】
 * 采用「分类偏好」模型管理用户个性化设置：
 * - 外观、区域、工作流、隐私、通知、编辑器、快捷键、实验性、UI 状态
 * - 类型安全的按分类读取/更新
 * - 按 SETTING_REGISTRY key 的单项读取/验证
 */

export { UserSetting } from './user-setting';
export type { UserSettingState } from './user-setting';

// 注意：Setting 和 AppConfig 旧聚合根已弃用，保留文件仅供迁移参考
