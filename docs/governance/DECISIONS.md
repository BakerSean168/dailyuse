---
tags:
  - governance
  - decisions
  - ddd
description: Governance 模块决策记录 - 只记录稳定且重要的设计选择
created: 2026-03-14T00:00:00
updated: 2026-03-14T00:00:00
---

# Governance 决策记录

## 1. 这是“最佳实践示范模块”，不是“最少实现模块”

- 目标不是只够用
- 目标是让后来者直接照着抄也不会走偏

## 2. Props vs State 双命名约定保留

- Value Object / factory params 使用 `Props`
- Aggregate / Entity 内部持久状态使用 `State`
- 原因：与 `ValueObject` 基类 API 以及可变生命周期语义都更一致

## 3. 公共 API 优先使用 `@internal` 标注，而不是粗暴删除 barrel export

- 活文档需要保留完整实现结构
- 但不应把内部实现误导成稳定公共 API

## 4. Branded ID 必须贯穿 contracts / runtime / validation

- 类型层：branded types
- 运行时：`createIdType<T>()`
- 校验层：`brandedId<T>()`
- 三层不一致会导致 schema 接受不了系统自己生成的 ID

## 5. 路由必须按资源 / feature 拆分

- governance 要展示 ADR-021，而不是继续单大文件
- route 也是架构实践的一部分，不是附属品

## 6. 三层采用三种最自然的拆分维度

- 领域层：按聚合根 / 实体组织
- 应用层：按 commands / queries 组织
- 路由层：按资源 / feature 组织

原因：

- 如果路由层也照搬 command/query，会让外部 API 语义过于内部化
- 如果应用层按资源拆，会削弱 use case 的表达力
- 如果领域层按 HTTP 资源拆，会污染业务模型

## 7. 轻量 docs 作为主入口，包内长文档作为深度资料

- `docs/governance/*` 负责导航、速查、变更手册、决策
- `packages/governance/*.md` 保留深度背景与实现细节

## 8. 前端缓存采用“Pinia 存 POJO，composable 按需实体化”

- 浏览器缓存解决网络优化，不是业务状态真相来源
- Pinia 负责响应式业务缓存
- `GovernanceClientService` 直接返回 `RuleClientDTO`
- composable 在需要 richer behavior 时调用 `Rule.fromClientDTO()`

原因：

- 直接存 class 实例不利于序列化、调试和持久化
- 直接只用 DTO 又会失去 richer client domain 的价值
- 该折中方案最适合 governance 这种“有业务语义，但又不值得前端全量重领域化”的模块
