/**
 * Application Client Services - Barrel Export
 * 应用客户端服务 - 统一导出
 *
 * 【使用场景】
 * - Vue Composables
 * - React Hooks
 * - 其他框架的响应式封装
 *
 * 【特点】
 * - 单一 facade 入口
 * - 直接返回 RuleClientDTO（客户端视图模型）
 * - 支持依赖注入
 */

export { GovernanceClientService } from './governance-client-service';
