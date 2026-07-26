---
tags:
  - architecture
  - index
description: 架构文档入口
created: 2026-04-13T00:00:00
updated: 2026-04-26T00:00:00
---

# 架构入口

`docs/architecture` 只保留长期有效的架构入口、ADR 和少量总览说明，不承担实现百科、迁移进度或阶段性计划。

## 当前入口

- [`../standards/architecture.md`](../standards/architecture.md)：长期有效的架构规则
- [`adr/README.md`](./adr/README.md)：正式 ADR 索引与编号规则
- [`../governance/README.md`](../governance/README.md)：仓库治理来源、检查方式与文档约定

## 使用方式

- 需要看规则是什么：先看 `docs/standards`
- 需要看为什么这样定：看 ADR
- 需要确认当前真实边界：看 `project.json`、配置文件、实现代码和测试

## 不在这里维护的内容

- 分阶段迁移计划
- 与代码重复的一次性实现说明
- 模块级的长篇操作手册

## 产品时间

- [ADR-037 产品时间体系](./adr/ADR-037-product-time-system.md)
- [产品时间体系详设](./product-time-system.md)
