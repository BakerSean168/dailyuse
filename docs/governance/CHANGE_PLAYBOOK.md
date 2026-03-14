---
tags:
  - governance
  - playbook
  - maintenance
description: Governance 变更手册 - 常见改动的最短路径
created: 2026-03-14T00:00:00
updated: 2026-03-14T00:00:00
---

# Governance 变更手册

## 新增规则字段

1. 更新 `src/contracts` 中对应 DTO / Zod schema
2. 更新 `src/domain-server/aggregates/rule.ts` 的 state / create / load / toDTO
3. 更新 Prisma / PowerSync mapper
4. 更新相关 tests

## 新增状态流转

1. 在 `src/domain-server/aggregates/rule.ts` 增加业务方法
2. 如有必要，补 domain event
3. 更新 use case 编排
4. 更新 controller 错误映射
5. 更新 tests 与文档

## 新增 HTTP 端点

1. 先判断属于哪个资源：`Rule` 还是 `RuleRevision`
2. 优先落在现有资源文件：`governance-rules.routes.ts` 或 `governance-rule-revisions.routes.ts`
3. 只有当某个资源继续膨胀到不优雅时，才在该资源内部继续细分 feature 文件
4. 在 route 文件内注册 OpenAPI
5. 在 `src/api/routes/index.ts` 聚合
6. 补 route contract spec

## 选择拆分方式时的判断顺序

1. 先问：这是哪个资源？
2. 再问：这是该资源下的哪个 feature？
3. 不要先问：它是 command 还是 query

`command/query` 属于应用层，不是路由层的第一拆分维度。

## 新增查询参数

1. 修改 contracts query schema
2. 修改 route parser
3. 修改 use case 输入类型与实现
4. 补 schema / use case / route 测试

## 新增持久化实现差异

1. 优先对齐仓储接口
2. 再对齐 Prisma 与 PowerSync 双 mapper
3. 避免让某一端独享领域语义

## 新增示例规则 seed

1. 修改 `src/infrastructure-server/seed/seed-data.ts`
2. 保证它既能说明业务规则，也能说明代码规范
3. 不要把 seed 写成只对 demo 有意义的空内容

## 调整前端缓存策略

1. `application-client` 只负责调用并返回 DTO
2. Pinia 只缓存 POJO / DTO，不缓存 class 实例
3. composable 内按需调用 `Rule.fromClientDTO()` 做实体水化
4. 只有 UI 真的需要 richer behavior 时才使用 hydrated entity

这样可以同时保留：

- Pinia 的响应式与可序列化
- domain-client richer helper / behavior 的价值
