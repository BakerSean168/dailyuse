# Governance 模式索引 — 活文档参考指南

> **提示词索引文档**：当你需要实现某个 DDD 模式时，参考本索引找到 governance 模块中的对应示例。
>
> governance 模块是项目的**活文档**，所有实现都附带详实的 JSDoc 注释，既是可运行代码也是规范文档。

## 📋 模式速查表

| 模式 | 参考文件 | 说明 |
|------|---------|------|
| [聚合根](#1-聚合根aggregate-root) | `packages/governance/src/domain-server/aggregates/rule.ts` | 私有构造 + 工厂方法 + 状态机 + 领域事件 |
| [值对象 (Class)](#2-值对象value-object) | `packages/governance/src/domain-shared/value-objects/rule-tag.ts` | 不可变、规范化、序列化 |
| [值对象 (Const Object)](#3-const-object-枚举) | `packages/governance/src/domain-shared/value-objects/rule-status.ts` | Branded Type + 状态机逻辑 |
| [仓储模式](#4-仓储模式repository-pattern) | `packages/governance/src/domain-server/repositories/i-rule-repository.ts` | 接口定义 + DI Token |
| [领域事件](#5-领域事件domain-events) | `packages/governance/src/contracts/domain/events/` | 事件定义 + 发布 |
| [组合根](#6-组合根composition-root) | `packages/governance/src/infrastructure-server/governance.module.ts` | 依赖注入入口 |
| [DI 容器](#7-依赖注入容器) | `packages/governance/src/infrastructure-server/di/governance-container.ts` | Singleton + 运行时校验 |
| [Use Case](#8-use-casecommand--query) | `packages/governance/src/application-server/use-cases/` | CQRS 命令/查询分离 |
| [Result 模式](#9-result-模式) | 全部领域方法 | 统一错误处理，不使用异常 |
| [DTO 分层](#10-dto-分层) | `packages/governance/src/contracts/aggregates/` | Client / Server / Persistence 视图 |
| [控制器](#11-控制器模式) | `packages/governance/src/controllers/governance.controller.ts` | Zod 校验 + Use Case 编排 |
| [契约层活文档](#12-契约层活文档) | `packages/governance/src/contracts/README.md` | 模块结构完整指南 |

---

## 1. 聚合根（Aggregate Root）

**参考文件**: `packages/governance/src/domain-server/aggregates/rule.ts`

**核心要点**:
- 私有构造函数，外部只能通过 `create()` / `load()` 工厂方法创建
- Props Object 模式（`CreateRuleProps`, `UpdateRuleProps`）封装参数
- 私有 backing 字段 + readonly getters 保证不可变性
- 所有业务方法返回 `Result<T>`，不抛异常
- 状态变更自动发布领域事件
- 集合操作（tags, codeSnippets）有业务规则约束（如最少数量）

**提示词**: _"领域聚合根的实现参考 `packages/governance/src/domain-server/aggregates/rule.ts` 中的 Rule 聚合根。"_

---

## 2. 值对象（Value Object）

**参考文件**:
- Class 类型: `packages/governance/src/domain-shared/value-objects/rule-tag.ts`
- Class 类型: `packages/governance/src/domain-shared/value-objects/code-snippet.ts`

**核心要点**:
- 不可变（所有修改返回新实例）
- 工厂方法三件套：`create()`（带校验）、`fromDTO()`、`fromPersistenceDTO()`
- 私有 `validate()` 集中校验逻辑
- 序列化方法：`toDTO()`、`toPersistenceDTO()`、`toString()`
- 计算属性和行为方法封装丰富的领域逻辑

**提示词**: _"Class 类型值对象的实现参考 `packages/governance/src/domain-shared/value-objects/rule-tag.ts`。"_

---

## 3. Const Object 枚举

**参考文件**:
- `packages/governance/src/domain-shared/value-objects/rule-status.ts` — 含状态机
- `packages/governance/src/domain-shared/value-objects/rule-severity.ts` — 含比较逻辑
- `packages/governance/src/domain-shared/value-objects/language.ts` — 简单枚举
- `packages/governance/src/domain-shared/value-objects/snippet-type.ts` — 简单枚举

**核心要点**:
- 使用 Branded Type（`& { readonly __brand: unique symbol }`）替代 TypeScript enum
- 提供 `create()` 工厂方法（返回 `Result<T>`）
- 提供 `isValid()` 类型守卫
- 可选：状态机逻辑（`canTransitionTo`）、比较逻辑（`isStricterThan`）

**提示词**: _"Const Object 枚举模式参考 `packages/governance/src/domain-shared/value-objects/rule-status.ts`。"_

---

## 4. 仓储模式（Repository Pattern）

**参考文件**:
- 接口: `packages/governance/src/domain-server/repositories/i-rule-repository.ts`
- 实现: `packages/governance/src/infrastructure-server/adapters/prisma/rule-prisma.repository.ts`

**核心要点**:
- 领域层定义接口（依赖倒置原则）
- 基础设施层提供实现（Prisma 适配器）
- 使用 Symbol Token 进行 DI 绑定
- 所有方法返回 `Promise<Result<T>>`
- Filter 对象用于查询条件

**提示词**: _"仓储接口的定义参考 `packages/governance/src/domain-server/repositories/i-rule-repository.ts`。"_

---

## 5. 领域事件（Domain Events）

**参考文件**:
- 事件定义: `packages/governance/src/contracts/domain/events/`
- 事件发布: `packages/governance/src/domain-server/aggregates/rule.ts`（搜索 `addDomainEvent`）

**核心要点**:
- 事件在契约层定义类型（EventMap）
- 聚合根通过 `addDomainEvent()` 发布事件
- 事件命名规范：`module:entity-action`（如 `governance:rule-created`）
- 事件载荷只包含必要数据，不包含完整实体

**提示词**: _"领域事件的定义参考 `packages/governance/src/contracts/domain/events/`。"_

---

## 6. 组合根（Composition Root）

**参考文件**: `packages/governance/src/infrastructure-server/governance.module.ts`

**核心要点**:
- 接收外部注入的 Repository 实现
- 注册到 DI 容器
- 实例化并暴露全部 Use Case
- 不包含业务逻辑，仅负责"组装"

**提示词**: _"模块组合根的实现参考 `packages/governance/src/infrastructure-server/governance.module.ts`。"_

---

## 7. 依赖注入容器

**参考文件**: `packages/governance/src/infrastructure-server/di/governance-container.ts`

**核心要点**:
- Singleton 模式
- 运行时校验（未注册时抛出明确错误）
- `reset()` 方法支持测试场景

**提示词**: _"DI 容器的实现参考 `packages/governance/src/infrastructure-server/di/governance-container.ts`。"_

---

## 8. Use Case（Command / Query）

**参考文件**: `packages/governance/src/application-server/use-cases/`

**核心要点**:
- Commands（写操作）：`commands/create-rule.use-case.ts`, `update-rule.use-case.ts`, `delete-rule.use-case.ts`
- Queries（读操作）：`queries/get-rule.use-case.ts`, `list-rules.use-case.ts`, `get-revisions.use-case.ts`
- 每个 Use Case 接收 Repository 接口，不依赖具体实现
- 返回 `Result<T>`

**提示词**: _"Use Case 的实现参考 `packages/governance/src/application-server/use-cases/`。"_

---

## 9. Result 模式

**全局参考**: `@dailyuse/contracts/result`

**核心要点**:
- 所有业务方法返回 `Result<T>` 而非 throw
- `ok(data)` 表示成功，`error(code, message)` 表示失败
- 调用方通过 `result.ok` 判断成功/失败
- governance 中每个聚合根方法、Use Case 都遵循此模式

**提示词**: _"Result 模式的使用参考 governance 模块中任意聚合根方法或 Use Case。"_

---

## 10. DTO 分层

**参考文件**: `packages/governance/src/contracts/aggregates/`

**核心要点**:
- **Client DTO**（`rule-client.ts`）：前端/API 消费者视图，使用 `TransferDate`（number）
- **Server DTO**（`rule-server.ts`）：后端视图，使用 `DomainDate`（Date）
- **Persistence DTO**：数据库存储视图，使用 `PersistenceDate`（Date）
- 时间防腐层保证各层类型安全

**提示词**: _"DTO 分层的实现参考 `packages/governance/src/contracts/aggregates/`。"_

---

## 11. 控制器模式

**参考文件**: `packages/governance/src/controllers/governance.controller.ts`

**核心要点**:
- Zod Schema 输入校验
- 转换标准 Context → 业务 ExecutionContext
- 编排 Use Case 调用
- 格式化错误响应

**提示词**: _"控制器的实现参考 `packages/governance/src/controllers/governance.controller.ts`。"_

---

## 12. 契约层活文档

**参考文件**: `packages/governance/src/contracts/README.md`

**核心要点**:
- 完整的模块结构说明和新建模块指南
- Aggregate vs Entity vs Value Object 的区别
- 时间类型选择规范（防腐层设计）
- Protocol（EventMap + RpcMap）定义规范
- 常见错误与正确做法对照

**提示词**: _"新模块的契约层结构参考 `packages/governance/src/contracts/README.md`。"_

---

## 🔗 相关文档

- [项目规范索引](../standards/index.md)
- [架构分析](../ARCHITECTURE_ANALYSIS.md)
- [RPC 模式文档](../patterns/RPC_INDEX.md)
- [governance 模块 README](../../packages/governance/README.md)
- [governance 契约层 README](../../packages/governance/src/contracts/README.md)
