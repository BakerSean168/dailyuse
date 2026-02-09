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
 * - 薄薄一层，方便调用
 * - 支持依赖注入
 * - 单例模式管理
 */

// Use Cases
export { CreateRule } from './create-rule';
export { GetRule } from './get-rule';
export { UpdateRule } from './update-rule';
export { DeleteRule } from './delete-rule';
export { ListRules } from './list-rules';
export { SearchRules } from './search-rules';

// Legacy service (待迁移)
export { RuleClientService } from './rule-client-service';
