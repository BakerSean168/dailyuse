# @dailyuse/governance

治理模块（活文档）— 通过 **架构规则管理** 业务场景展示项目当前最优雅的 DDD / Clean Architecture / Result / Zod / split-route 实践

## 业务场景

一个完整的架构规则生命周期管理系统：

- 规则的创建、编辑、删除与状态流转
- 状态机：Draft → Active → Deprecated / 重新激活
- 严重级别：Mandatory（强制）、Recommended（推荐）
- 标签与代码示例（Good / Bad Example）管理

## 分层架构

```
contracts (契约层)
- 类型定义（interface / type）
- DTO（Client / Server / Persistence）
- 领域事件
- API Schema (Zod)
- RPC/Event 映射（Protocol）

domain-shared (共享领域层)
- 值对象工厂（ID 生成、验证）
- 状态机逻辑
- 前后端可共享的业务常量

domain-server (服务端领域层)
- 聚合根（Rule）
- 实体（RuleRevision）
- 仓储接口（IRuleRepository）
- 领域服务（RuleDomainService）

domain-client (客户端领域层)
- 客户端聚合根（Rule — UI 辅助方法）

application-server (服务端应用层)
- Use Cases（Commands + Queries）
- 执行上下文（ExecutionContext）

application-client (客户端应用层)
- GovernanceClientService（单一 facade，前端注入用 application service）
- 直接返回 RuleClientDTO（客户端视图模型）

infrastructure-server (服务端基础设施层)
- Prisma 仓储实现
- PowerSync 仓储实现
- 显式组合根（createGovernanceModule）
- 内部组装辅助（createGovernanceUseCases，仅基础设施层使用）

infrastructure-client (客户端基础设施层)
- HTTP 适配器（RuleHttpAdapter）
- IPC 适配器（RuleIpcAdapter）

api (API 层)
- 分拆路由定义（routes/*，按 feature 拆分）
- 模块 runtime 贡献（start / stop）

controllers (控制器层)
- 输入校验、编排、响应序列化
```

## 前端缓存建议

- `GovernanceClientService` 负责调用后端并返回 `RuleClientDTO`
- Pinia 负责缓存 POJO / DTO
- UI composable 按需调用 `Rule.fromClientDTO()` 水化 richer client entity
- 不建议在 Pinia 中直接存储 class 实例

## 使用示例

```typescript
// 1. 导入契约层类型
import type { RuleClientDTO, RuleStatus } from '@dailyuse/governance/contracts';

// 2. 使用值对象工厂
import { RuleTag, RuleStatus } from '@dailyuse/governance/domain-shared';

// 3. 使用聚合根
import { Rule, IRuleRepository } from '@dailyuse/governance/domain-server';

// 创建规则
const result = Rule.create({
  code: 'DDD-001',
  title: '聚合根必须使用私有构造函数',
  description: '所有聚合根必须通过工厂方法创建...',
  severity: RuleSeverity.Mandatory,
  tags: ['ddd', 'aggregate-root'],
  goodExamples: [{ language: 'TypeScript', content: '// ...' }],
  badExamples: [{ language: 'TypeScript', content: '// ...' }],
  authorId: userId,
});

// 状态流转
rule.activate(); // Draft → Active
rule.deprecate(reason); // Active → Deprecated
```

## 核心规范展示

| 规范              | 说明                                        | 位置                                         |
| ----------------- | ------------------------------------------- | -------------------------------------------- |
| Branded Types     | 防止 ID 混用                                | `domain-shared/value-objects/rule-id.ts`     |
| Const Object 枚举 | 替代 TypeScript enum                        | `domain-shared/value-objects/rule-status.ts` |
| DTO 分层          | Client / Server / Persistence               | `contracts/aggregates/`                      |
| 时间防腐层        | TransferDate / DomainDate / PersistenceDate | `contracts/aggregates/`                      |
| 富血模型          | 聚合根内聚业务逻辑                          | `domain-server/aggregates/rule.ts`           |
| 工厂方法模式      | `create()` / `load()`                       | `domain-server/aggregates/rule.ts`           |
| 领域事件          | 状态变更时发布事件                          | `domain-server/aggregates/rule.ts`           |
| 仓储模式          | 依赖倒置原则                                | `domain-server/repositories/`                |
| 状态机            | 状态转换规则封装                            | `domain-shared/value-objects/rule-status.ts` |
| Result 模式       | 业务方法返回 Result                         | 全部领域方法                                 |
| 组合根            | 显式依赖注入入口                            | `infrastructure-server/governance.module.ts` |

## 文件结构

```
src/
├── contracts/              # 契约层 — 类型定义、DTO、事件、API Schema
├── domain-shared/          # 共享领域 — ID 工厂、状态机逻辑、值对象
├── domain-server/          # 服务端领域 — 聚合根、仓储接口、领域服务
├── application-server/     # 应用层 — Use Cases (Commands + Queries)
├── infrastructure-server/  # 基础设施 — Prisma 仓储、显式组合根
├── controllers/            # 控制器 — 输入校验、编排
├── application-client/     # 客户端应用层 — 客户端服务
├── domain-client/          # 客户端领域 — 视图模型
├── infrastructure-client/  # 客户端基础设施 — HTTP/IPC 适配器
├── api/                    # API 模块 — 分拆路由、启动、初始化
└── index.ts                # 主入口 — 统一导出
```

## 活文档定位

> **这个模块即是代码，也是文档。**
>
> governance 中的每个实现文件都必须包含详细的 JSDoc 注释，解释 DDD 模式和设计决策；`pnpm nx run daily-use:governance-check` 会通过 `governance-module-docs-audit.mjs` 审计这一约束。
> 新模块开发时，可以直接参考本模块的实现模式。
>
> 📖 从 [docs/governance/README.md](../../docs/governance/README.md) 开始获取轻量导航、速查卡与变更手册。

## 推荐阅读顺序

1. `../../docs/governance/README.md` — 模块入口与学习路径
2. `../../docs/governance/QUICK_REFERENCE.md` — 一页速查
3. 当前 README — 模块边界与代码入口
4. 具体代码文件与注释
