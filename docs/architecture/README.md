---
tags:
  - architecture
  - index
description: 架构文档入口
created: 2026-04-13T00:00:00
updated: 2026-04-13T00:00:00
---

# 架构入口

`docs/architecture` 只保留长期有效的架构入口、ADR 和少量专题说明，不再保留按阶段生成的大型实现讲解、迁移方案、优化进度和模块级厚说明。

## 当前应优先看什么

- [`../standards/architecture.md`](../standards/architecture.md)：通用架构规则
- [`adr/README.md`](./adr/README.md)：关键架构决策记录
- [`../governance/README.md`](../governance/README.md)：governance 活文档入口
- 对应模块的代码、配置和测试注释：实现边界与落地理由

## 这里不再承担的职责

- 不再维护 Web / API / Desktop / Result pattern 的长篇“实现百科”
- 不再维护迁移计划、inventory、progress、matrix、blueprint
- 不再重复代码中已经可直接读出的依赖关系和配置细节

## 使用约定

- 需要架构原则时，看 `docs/standards/architecture.md`
- 需要某次关键架构选择的理由时，看 ADR
- 需要某模块当前实现边界时，优先看模块代码、`project.json`、配置文件和注释
