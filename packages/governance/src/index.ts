/**
 * @dailyuse/governance
 * 
 * 治理模块 - 架构规则与代码标准的活文档库
 * 
 * 【业务场景】
 * 一个简单的待办事项管理，包含：
 * - 创建、编辑、删除待办事项
 * - 状态流转：待处理 → 进行中 → 已完成/已取消
 * - 优先级管理：低、中、高
 * 
 * 【分层架构】
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────┐
 * │  contracts (契约层)                                      │
 * │  - 类型定义（interface/type）                            │
 * │  - DTO（Client/Server/Persistence）                     │
 * │  - 领域事件                                              │
 * │  - API Schema (Zod)                                     │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-shared (共享领域层)                              │
 * │  - 值对象工厂（ID 生成、验证）                           │
 * │  - 状态机逻辑                                            │
 * │  - 前后端可共享的业务规则                                │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-server (服务端领域层)                            │
 * │  - 聚合根（Todo）                                        │
 * │  - 仓储接口（ITodoRepository）                          │
 * │  - 领域服务（TodoDomainService）                        │
 * └─────────────────────────────────────────────────────────┘
 * ```
 * 
 * 【使用示例】
 * 
 * ```typescript
 * // 1. 导入契约层类型
 * import type { TodoServerDTO, TodoStatus } from '@dailyuse/example-sample/contracts';
 * 
 * // 2. 导入值对象工厂
 * import { TodoIdFactory, TodoStatusLogic } from '@dailyuse/example-sample/domain-shared';
 * 
 * // 3. 导入聚合根
 * import { Todo, ITodoRepository } from '@dailyuse/example-sample/domain-server';
 * 
 * // 创建 Todo
 * const todo = Todo.create({
 *   userId: UserIdFactory.generate(),
 *   title: '学习 DDD',
 *   priority: TodoPriority.High,
 * });
 * 
 * // 状态流转
 * todo.start();      // 待处理 → 进行中
 * todo.complete();   // 进行中 → 已完成
 * ```
 * 
 * 【核心规范展示】
 * 
 * 1. Branded Types（品牌类型）- 防止 ID 混淆
 * 2. Const Object 枚举 - 替代 TypeScript enum
 * 3. DTO 分层 - Client/Server/Persistence
 * 4. 时间防腐层 - TransferDate/DomainDate/PersistenceDate
 * 5. 充血模型 - 聚合根包含业务逻辑
 * 6. 工厂方法 - create() / fromPersistence()
 * 7. 领域事件 - 状态变更时发出事件
 * 8. 仓储模式 - 依赖倒置
 */

// 使用命名空间导出避免命名冲突
export * as Governance from './governance-exports';

// 兼容旧的 Todo 示例导出（临时保留）
export * as Contracts from './contracts';
export * as DomainShared from './domain-shared';
export * as DomainServer from './domain-server';
