---
tags:
  - governance
  - quick-reference
  - architecture
description: Governance 一页速查卡 - 分层、边界、改动入口
created: 2026-03-14T00:00:00
updated: 2026-03-14T00:00:00
---

# Governance 快速参考卡

## 一页结构图

| 层                    | 目录                         | 负责什么                              |
| --------------------- | ---------------------------- | ------------------------------------- |
| Contracts             | `src/contracts/`             | DTO、Schema、事件、ID 类型            |
| Domain Shared         | `src/domain-shared/`         | 值对象、状态机、共享常量              |
| Domain Server         | `src/domain-server/`         | 聚合根、实体、仓储接口、领域服务      |
| Application Server    | `src/application-server/`    | Commands / Queries 编排               |
| Controllers           | `src/controllers/`           | 校验、编排、错误归一                  |
| API Routes            | `src/api/routes/`            | 按资源 / feature 注册 HTTP 路由       |
| Infrastructure Server | `src/infrastructure-server/` | Prisma / PowerSync / 组合根           |
| Application Client    | `src/application-client/`    | 客户端 service facade（直接返回 DTO） |
| Infrastructure Client | `src/infrastructure-client/` | HTTP / IPC adapter                    |

## 前端数据流（推荐）

```text
GovernanceClientService -> Pinia(POJO cache) -> composable(on-demand hydrate) -> components
```

- Store 里只存 POJO / DTO，不存 class 实例
- composable 按需把 `RuleClientDTO` 水化为 `domain-client Rule`
- 组件优先使用 composable，不直接依赖 transport adapter

## 改动去哪改

| 需求              | 主要文件                                        |
| ----------------- | ----------------------------------------------- |
| 新增请求字段      | `src/contracts/api/*.ts` + 相关 DTO             |
| 新增领域规则      | `src/domain-server/aggregates/rule.ts`          |
| 新增查询/命令     | `src/application-server/use-cases/`             |
| 新增 HTTP 端点    | `src/api/routes/*.routes.ts`                    |
| 新增 OpenAPI 注册 | 同对应 route 文件                               |
| 新增持久化字段    | `src/infrastructure-server/adapters/*/mappers/` |
| 新增客户端调用    | `src/application-client/services/`              |

## 路由拆分规则

- 路由层按资源 / feature 拆，不按 command/query 拆
- `Rule` 主资源放 `governance-rules.routes.ts`
- `RuleRevision` 子资源放 `governance-rule-revisions.routes.ts`
- 共享 parser / response schema 放 `governance-route-shared.ts`
- 聚合顺序必须保证：静态路径先于 `/:id`
- 路由层也要成为最佳实践示范，不接受“先写成一个大文件再说”

## 三层拆分口诀

- 领域层看业务模型：aggregate / entity
- 应用层看用例：commands / queries
- 路由层看外部 API：resource / feature

## 常见反模式

- 在 controller 里写业务逻辑
- 在 route 文件里复制 query parser 和 response schema
- 把 `/search`、`/:id/revisions` 和 `/:id` 写进无序大文件
- 让 contracts 和 domain validation 漂移
