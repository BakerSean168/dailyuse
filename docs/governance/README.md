---
tags:
  - governance
  - reference
  - living-doc
description: Governance 活文档入口 - 用最小文档集导航 governance 模块的最佳实践
created: 2026-03-14T00:00:00
updated: 2026-03-14T00:00:00
---

# Governance 活文档

`@dailyuse/governance` 是 Memoflow 当前用于展示 DDD / Clean Architecture / Result / Zod / split-route 最佳实践的参考模块。

## 你应该先看什么

| 如果你想...                | 看这里                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| 快速理解模块结构           | [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)                                             |
| 知道改一个功能要动哪些文件 | [`CHANGE_PLAYBOOK.md`](./CHANGE_PLAYBOOK.md)                                             |
| 理解为什么这样设计         | [`DECISIONS.md`](./DECISIONS.md)                                                         |
| 深入看完整实现             | [`../../packages/governance/ARCHITECTURE.md`](../../packages/governance/ARCHITECTURE.md) |

## 模块定位

- 它首先是“参考模块 / 活文档”
- 它同时也是可运行的规则治理模块
- 它展示的不是最少代码，而是当前项目认可的优雅实践

## 当前示范重点

- Result pattern 全链路传播
- Branded ID + Zod 契约校验
- DDD 富领域模型 + 修订历史
- Prisma / PowerSync 双适配器
- API 路由按 feature 拆分，而非单文件堆叠

## 分层拆分原则

- 领域层：按聚合根 / 实体组织
- 应用层：按 commands / queries 组织
- 路由层：按资源 / feature 组织

这三者故意不使用同一套命名，因为它们服务的是不同视角：

- 领域层表达业务模型
- 应用层表达用例编排
- 路由层表达外部 API 边界

## 代码入口

- 包入口：`packages/governance/README.md`
- 深度架构：`packages/governance/ARCHITECTURE.md`
- 实现手册：`packages/governance/IMPLEMENTATION_GUIDE.md`
- 路由聚合器：`packages/governance/src/api/routes/index.ts`

## 推荐学习顺序

1. `QUICK_REFERENCE.md`
2. `packages/governance/README.md`
3. `packages/governance/ARCHITECTURE.md`
4. `CHANGE_PLAYBOOK.md`
5. 具体代码文件


