---
tags:
  - standards
  - index
  - reference
description: 项目规则与规范入口
created: 2025-01-22T00:00:00
updated: 2026-05-16T00:00:00
---

# 项目规范

`docs/standards` 只回答“规则是什么”。需要开发步骤看 `docs/guides/development`，需要测试入口看 `docs/test`，需要决策背景看 ADR。

## 当前规范文档

| 文档 | 用途 |
| --- | --- |
| [architecture.md](./architecture.md) | 通用架构与分层规则 |
| [contract-module-development-spec.md](./contract-module-development-spec.md) | `packages/contracts` 模块结构、纯类型边界与 API/Protocol 约束 |
| [domain-client-spec.md](./domain-client-spec.md) | client 领域层约束 |
| [domain-event-spec.md](./domain-event-spec.md) | 领域事件约束 |
| [domain-server-spec.md](./domain-server-spec.md) | server 领域层约束 |
| [domain-shared-class-value-object-spec.md](./domain-shared-class-value-object-spec.md) | class 值对象约束 |
| [domain-shared-type-value-object-spec.md](./domain-shared-type-value-object-spec.md) | type 值对象约束 |
| [import-path-policy.md](./import-path-policy.md) | import 路径：`@dailyuse/*` 公开入口、包内相对路径、可选 `@/` |
| [monorepo-build-standard.md](./monorepo-build-standard.md) | workspace 开发态源码引用与构建态产物引用规范 |
| [types-undefined-or-null-spec.md](./types-undefined-or-null-spec.md) | `undefined` / `null` 约定 |
| [configs-vs-constants规范.md](./configs-vs-constants规范.md) | config 与 constant 边界 |
| [枚举与常量对象规范(Enum&Constant-Objects).md](./枚举与常量对象规范(Enum&Constant-Objects).md) | 枚举与常量对象写法 |
| [枚举类型在数据库中改为string.md](./枚举类型在数据库中改为string.md) | 数据库存 `string` 的约束说明 |
| [enum写法.md](./enum写法.md) | enum 写法约定 |
| [值对象可以是type.md](./值对象可以是type.md) | 轻量值对象边界 |
| [值对象里的时间使用number时间戳-毫秒.md](./值对象里的时间使用number时间戳-毫秒.md) | 时间值表达约定 |
| [id值对象生成id的实现.md](./id值对象生成id的实现.md) | ID 生成实现约定 |

## 使用约定

- 新规则先落在这里，再视需要同步开发指南。
- 不在这里重复抄 `nx.json`、`eslint.config.ts`、`project.json` 的配置细节。
- 文档与代码冲突时，以当前代码、配置和测试为准。
