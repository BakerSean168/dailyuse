/**
 * Setting Domain Services
 * 设置模块领域服务导出
 * 
 * 【规范说明：领域服务（Domain Service）】
 * 领域服务是跨聚合根的业务逻辑，使用场景：
 * - 一次操作涉及多个聚合根时
 * - 业务逻辑不属于任何单一聚合根
 * - 无决类状态：整个业务逻辑执行后才保存
 * - 注入仓储：很有给提供仓储侦可培议可蚓
 * 
 * 【SettingDomainService】
 * - 设置查询逻辑：分层查询设置（全局 > 工作区 > 用户 > 设备）
 * - 设置覆盖规则：应用配置优先级覆盖
 * - 默认值填充：检查是否设置，返回默认值或用户值
 * - 批量操作：设置导入导出
 */

export { SettingDomainService } from './SettingDomainService';
