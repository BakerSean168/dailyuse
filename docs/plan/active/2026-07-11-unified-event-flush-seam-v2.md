---
tags:
  - plan
  - active
  - event-bus
  - governance
description: 工程 C 在 server-first 目录重构后的重放、扩展与治理收尾计划
created: 2026-07-11T00:00:00+00:00
updated: 2026-07-11T00:00:00+00:00
---

# Unified Event Flush Seam V2

## 背景

原工程 C 基于旧的 `domain-server` / `infrastructure-server` 目录完成 13 个仓储的自动
flush 收敛。PR #162 将业务包迁移到 `src/server/*` 后，旧提交无法直接合并，同时
`unflushed-events-audit` 仍只扫描旧路径，导致在新目录下审计 0 个文件。

## 范围

1. 让 unflushed-events audit 同时识别旧目录和 `src/server/*` 标准目录。
2. 将新目录扫描出的 9 个仓储接入统一事件发布 seam，并清空 baseline。
3. 保留 account PowerSync 仓储已有的可选事务执行器语义。
4. 补 adapter 回归测试，验证事务内持久化和持久化后事件发布。
5. 补齐 data-portability 的最小 `server/domain` 入口，使 ADR-031 shape audit 恢复通过。
6. 清理与本工程无关的 lockfile 版本漂移。

## 验证

- 相关业务包 typecheck、test、lint。
- `governance-tools:test`。
- `daily-use:governance-check`。
- `git diff --check`。

## 完成标准

- 新目录下 unflushed audit 扫描非零文件且 baseline 为零。
- 9 个仓储不再存在未发布事件路径。
- account PowerSync 的 `save(account, tx)` 使用传入事务执行器。
- 完整 governance-check 通过。
