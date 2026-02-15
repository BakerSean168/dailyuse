/**
 * Notification Domain Services
 * 通知模块领域服务导出
 * 
 * 【规范说明：领域服务（Domain Service）】
 * 领域服务是跨聚合根的业务逻辑，使用场景：
 * - 一次操作涉及多个聚合根时
 * - 业务逻辑不嵒于任何单一聚合根
 * - 无决类状态：整个业务逻辑执行后才保存
 * - 注入仓储：很有给提供仓储侟可培议
 * 
 * 【NotificationDomainService】
 * - 通知流程捕隔：通知创建、发送、方式方法选择
 * - 决帖业冡史：事务一致性
 * 
 * 【NotificationTemplateDomainService】
 * - 模板捕隔：模板变量、预览
 * 
 * 【NotificationPreferenceDomainService】
 * - 用户偏好业冡：检查用户偏好、日时途樛
 */

export { NotificationDomainService } from './NotificationDomainService';
export { NotificationPolicy } from './NotificationPolicy';
export { NotificationTemplateDomainService } from './NotificationTemplateDomainService';
export { NotificationPreferenceDomainService } from './NotificationPreferenceDomainService';
