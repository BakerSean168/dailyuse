---
tags:
  - standard
  - contract
  - packages-contracts
description: contracts 模块开发规范
created: 2026-02-03T00:00:00
updated: 2026-04-26T00:00:00
---

# Contracts 模块开发规范

适用范围：`packages/contracts`

`packages/contracts` 是当前工作区的共享契约中心。这里定义跨 app、跨包需要复用的类型、Schema 与协议，不承载业务逻辑、容器装配或运行时行为。

## 核心原则

- 纯类型优先：以 `type`、`interface`、Schema、常量对象为主，不写业务逻辑实现。
- 分层清晰：`protocol` 依赖 `api`，`api` 依赖 `aggregates` / `dtos` / `entities` / `value-objects`，不要反向导入。
- 单一真值：跨边界共享的数据结构必须从 `packages/contracts` 导出，调用方不要重新发明同名类型。
- 代码现实优先：如果当前模块结构与旧文档不一致，以现有代码、导出入口和测试为准，再回补文档。

## 推荐目录

新模块优先对齐 `packages/contracts/src/modules/authentication/` 的结构：

```text
modules/{domain}/
├── aggregates/
├── api/
├── domain/
│   └── events/
├── dtos/
├── entities/
├── protocol/
│   ├── {domain}-event-map.ts
│   └── {domain}-rpc-map.ts
├── value-objects/
└── index.ts
```

## 分层规则

### Protocol

- 只定义对外协议映射，例如 RPC map、event map。
- RPC key 使用 `'domain:kebab-case-operation'`。
- Event key 使用 `'domain:PascalCaseEvent'`。
- 不允许在协议映射里内联复杂对象类型，统一从 `../api` 或其他下层目录导入。

### API

- 请求、响应、查询类型集中定义，并通过 `api/index.ts` 暴露。
- 需要运行时校验的请求/查询优先配套 Zod Schema。
- 不从 `protocol` 回引类型，避免形成循环依赖。

### DTO / Aggregate / Entity / Value Object

- 复杂组合 DTO 放在 `dtos/`。
- 领域聚合与实体形状分别放在 `aggregates/`、`entities/`。
- 值对象契约放在 `value-objects/`，并根据需要明确 domain / transfer / persistence 形态。

## 命名与类型约束

- 实体标识符优先使用强类型 ID，而不是裸 `string`。
- 标识字段统一使用 `*Id` 后缀，避免 `*Uuid` 与 `*Id` 并存。
- 协议、DTO、实体、仓储映射中的标识符命名必须一致。
- 文件名保持 `kebab-case`，导出符号可以使用 `PascalCase`。

## 禁止项

- 在 `protocol` 中内联请求/响应对象。
- 在 `contracts` 中放业务逻辑、类方法实现或框架相关代码。
- API 层类型未从 `api/index.ts` 导出，却被其他层直接深路径引用。
- DTO 反向依赖 `protocol`。
- 新模块继续依赖历史理想结构而不是当前 `packages/contracts` 实际代码。

## 检查口径

- 新模块优先参考 `authentication` 的现有结构，而不是已退役脚手架中的历史示例。
- 文档用于说明规则，不替代 `tsconfig`、导出入口和测试。
- 如果某条约束已经由代码生成、类型检查或测试覆盖，文档保持短而明确即可。
