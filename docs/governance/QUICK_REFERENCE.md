---
tags:
  - governance
  - quick-reference
  - architecture
description: Governance 一页速查卡 - 公开 seam、职责与改动入口
created: 2026-03-14T00:00:00
updated: 2026-07-06T00:00:00+08:00
---

# Governance 快速参考卡

## 一页结构图

| seam / 层 | 目录 / 入口 | 负责什么 |
| --- | --- | --- |
| Public Contracts | `@dailyuse/contracts/governance` | DTO、Schema、事件、ID 类型、Protocol |
| Contracts Mocks | `@dailyuse/contracts/mocks` | governance mock 数据 |
| Server Domain | `src/server/domain/` | 聚合根、实体、仓储接口、值对象 |
| Server Application | `src/server/application/` | Commands / Queries / `GovernanceApplicationPort` |
| Server Transport | `src/server/transport/` | 校验、控制器、transport 翻译 |
| Server Infrastructure | `src/server/infrastructure/` | Prisma / PowerSync / runtime / 组合根 / seed |
| API | `@dailyuse/governance/api` / `src/api/` | HTTP 模块与路由注册 |
| Client | `@dailyuse/governance/client` / `src/client/` | Web / Desktop renderer 客户端 seam |
| Electron | `@dailyuse/governance/electron` / `src/electron/` | Desktop main 注册入口 |
| Server Root | `@dailyuse/governance` | 规范化服务端组合根 |

治理模块公共契约已经外提到 `packages/contracts`，`packages/governance/src/` 内不再维护第二份 contracts，也不再对外暴露 `domain-client`、`application-client`、`infrastructure-client` 这类 layer-named seam。

## 前端数据流（推荐）

```text
@dailyuse/governance/client -> Pinia(POJO cache) -> app-vue display-rule helpers -> components
```

- Store 里只存 POJO / DTO，不存 class 实例
- app-vue 在本地派生展示模型，不再依赖 governance 包内 `domain-client`
- 组件优先使用 composable，不直接依赖 transport 细节

## 改动去哪改

| 需求 | 主要文件 |
| --- | --- |
| 新增请求字段 | `packages/contracts/src/modules/governance/api/*.ts` + 相关 DTO |
| 新增响应字段 | `packages/contracts/src/modules/governance/api/response-schemas.ts` + 相关 DTO |
| 新增 RPC channel / IPC payload | `packages/contracts/src/modules/governance/protocol/*` |
| 新增领域规则 | `src/server/domain/aggregates/rule.ts` |
| 新增值对象 / 领域不变量 | `src/server/domain/value-objects/` |
| 新增查询/命令 | `src/server/application/use-cases/` |
| 新增 HTTP 端点 | `src/api/routes/*.routes.ts` |
| 新增 transport 共享逻辑 | `src/server/transport/` |
| 新增模块运行时副作用 | `src/server/infrastructure/runtime/` |
| 新增桌面主进程治理接线 | `src/electron/index.ts` |
| 新增 Web / Renderer 调用 | `src/client/index.ts` |
| 新增 UI 展示派生 | `packages/app-vue/src/modules/governance/display-rule.ts` |
| 新增持久化字段 | `src/server/infrastructure/adapters/*/mappers/` |

## 路由拆分规则

- 路由层按资源 / feature 拆，不按 command/query 拆
- `Rule` 主资源放 `governance-rules.routes.ts`
- `RuleRevision` 子资源放 `governance-rule-revisions.routes.ts`
- 共享 parser / response schema 放 `governance-route-shared.ts`
- 聚合顺序必须保证：静态路径先于 `/:id`

## 四个服务端切片口诀

- `server/domain` 看业务模型与不变量
- `server/application` 看用例与调用门面
- `server/transport` 看控制器与 transport 翻译
- `server/infrastructure` 看适配器、runtime 与组合根

## 常见反模式

- 在 controller 里写业务逻辑
- 在 route 文件里复制 query parser 和 response schema
- 同时维护 `packages/contracts` 与模块内第二份 contracts
- 对外暴露 layer-named seam（如 `application-client`）
- 把 UI display logic 伪装成 `domain-client`
- 在通用 `contracts/electron` 再维护一份 governance channel 常量