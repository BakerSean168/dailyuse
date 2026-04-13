---
tags:
  - standards
  - index
  - reference
description: 项目规则与规范入口
created: 2025-01-22T00:00:00
updated: 2026-04-13T00:00:00
---

# 项目规范

本目录只保留规则本身，不再维护“标准与指南关系说明”之类的元文档。需要操作步骤时看开发指南，需要测试入口时看 `docs/test`，需要具体实现理由时看代码和配置注释。

## 入口原则

- 这里回答“规则是什么”。
- [`../guides/development/README.md`](../guides/development/README.md) 回答“日常开发该看什么”。
- [`../test/README.md`](../test/README.md) 回答“测试怎么分层、从哪里跑”。
- 代码、配置、fixture、helper 中的注释回答“为什么这样实现”。

## 当前规范文档

| 文档 | 用途 |
| --- | --- |
| [architecture.md](./architecture.md) | 通用架构原则 |
| [contract-module-development-spec.md](./contract-module-development-spec.md) | 合同/契约模块开发约束 |
| [domain-client-spec.md](./domain-client-spec.md) | client 领域层约束 |
| [domain-event-spec.md](./domain-event-spec.md) | 领域事件约束 |
| [domain-server-spec.md](./domain-server-spec.md) | server 领域层约束 |
| [domain-shared-class-value-object-spec.md](./domain-shared-class-value-object-spec.md) | class 值对象约束 |
| [domain-shared-type-value-object-spec.md](./domain-shared-type-value-object-spec.md) | type 值对象约束 |
| [types-undefined-or-null-spec.md](./types-undefined-or-null-spec.md) | `undefined` / `null` 约定 |
| [configs-vs-constants规范.md](./configs-vs-constants规范.md) | config 与 constant 边界 |
| [枚举与常量对象规范(Enum&Constant-Objects).md](./枚举与常量对象规范(Enum&Constant-Objects).md) | 枚举与常量对象写法 |
| [枚举类型在数据库中改为string.md](./枚举类型在数据库中改为string.md) | 数据库存 string 的规范说明 |
| [enum写法.md](./enum写法.md) | enum 写法约定 |
| [值对象可以是type.md](./值对象可以是type.md) | 轻量值对象边界 |
| [值对象里的时间使用number时间戳-毫秒.md](./值对象里的时间使用number时间戳-毫秒.md) | 时间值表达约定 |
| [id值对象生成id的实现.md](./id值对象生成id的实现.md) | ID 生成实现约定 |

## 使用约定

- 规则变化时，先改这里，再改对应开发指南和代码注释。
- 不再维护“快速参考卡”“整合说明”这类重复导航页。
- 如果某条规则已经完全体现在代码和测试中，优先让文档保持短，而不是继续扩写示例。
