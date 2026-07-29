---
tags:
  - plan
  - archive
  - governance
  - contracts
description: 将 governance 公共契约彻底收敛到 packages/contracts，并移除本地 contracts 特例
created: 2026-07-06T00:00:00+08:00
updated: 2026-07-06T00:00:00+08:00
---

# Governance Contracts Centralization

## 目标

将 `packages/governance/src/contracts` 中的公共数据契约彻底迁移到 `packages/contracts/src/modules/governance`，移除 `@memoflow/governance/contracts` 子路径与本地 contracts 目录，使 governance 与其他 feature module 的 contracts 组织完全一致。

## 结论前提

- 不保留兼容层
- 不保留双轨真值
- 只保留 feature 内部真正属于 application seam 的 port

## 实施步骤

1. 在 `packages/contracts/src/modules/governance` 下建立标准 contracts 模块目录与导出。
2. 将 governance 的 DTO、schema、value object contract、domain event payload、protocol map、config 迁入 centralized contracts。
3. 将 governance 的 client transport port 移入 `packages/governance/src/application-client/ports`，不再放在 contracts 中。
4. 将 governance 包内所有对本地 `contracts` 的依赖改为 `@memoflow/contracts/governance` 或 feature-local port。
5. 将全局 typed protocol registry 直接纳入 governance event/rpc map，删除 augmentation 特例。
6. 删除 `packages/governance/src/contracts`、`package.json` 中的 `./contracts` 导出与 `tsup` 对应入口。
7. 更新活文档、module index、tsconfig alias 与相关说明。
8. 运行 `contracts`、`governance`、调用方的定向验证，并补跑 `memoflow:governance-check`。

## 完成标准

- `packages/governance/src/contracts` 不再存在
- 外部调用统一通过 `@memoflow/contracts/governance`
- governance 内部不再通过相对路径依赖本地 contracts
- typed event/rpc registry 不再依赖 governance augmentation
- 文档与真实代码结构一致

## 完成记录

2026-07-14 复核：`packages/governance/src/contracts` 已不存在；`packages/governance/package.json` 仅保留 root、`api`、`client` 与 `electron` 公开面；全仓不存在对已删除 governance contracts 子路径的引用。计划目标已完成，归档保留实施背景。
