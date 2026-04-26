---
tags:
  - adr
  - index
description: 架构决策记录索引
created: 2025-11-23T15:00:00
updated: 2026-04-26T00:00:00
---

# ADR 索引

本目录只收录正式的 Architecture Decision Record。ADR 文件名必须使用 `ADR-XXX-kebab-case.md`，编号必须唯一；新增或调整 ADR 时，必须在同一变更中更新本索引。

## 当前 ADR

| 编号 | 标题 | 状态 | 日期 |
| --- | --- | --- | --- |
| [ADR-001](./ADR-001-use-nx-monorepo.md) | 使用 Nx Monorepo | 已采纳 | 2024-08-15 |
| [ADR-002](./ADR-002-ddd-pattern.md) | 采用 DDD 架构模式 | 已采纳 | 2024-08-20 |
| [ADR-003](./ADR-003-event-driven-architecture.md) | 事件驱动架构 | 已采纳 | 2024-09-01 |
| [ADR-004](./ADR-004-electron-desktop-architecture.md) | Electron 桌面应用架构与包提取策略 | 已采纳 | 2025-12-03 |
| [ADR-005](./ADR-005-ui-package-multi-framework.md) | UI 包多框架支持架构 | 已采纳 | 2025-12-03 |
| [ADR-006](./ADR-006-desktop-ipc-communication.md) | Desktop IPC 通信架构与依赖注入集成 | 已采纳 | 2025-12-06 |
| [ADR-007](./ADR-007-api-consistency.md) | API 接口一致性规范 | 提议中 | 未注明 |
| [ADR-008](./ADR-008-standard-api-response-format.md) | API Response Format | 已采纳 | 2026-01-15 |
| [ADR-009](./ADR-009-standard-clean-architecture-layers.md) | Clean Architecture Layers | 已采纳 | 2026-01-15 |
| [ADR-010](./ADR-010-standard-centralized-contracts.md) | Centralized Contracts | 已采纳 | 2026-01-15 |
| [ADR-011](./ADR-011-standard-naming-conventions.md) | Naming Conventions | 已采纳 | 2026-01-15 |
| [ADR-012](./ADR-012-standard-error-handling.md) | Error Handling | 已采纳 | 2026-01-15 |
| [ADR-013](./ADR-013-standard-testing-strategy.md) | Testing Strategy | 已采纳 | 2026-01-15 |
| [ADR-014](./ADR-014-standard-typescript-guidelines.md) | TypeScript Guidelines | 已采纳 | 2026-01-15 |
| [ADR-015](./ADR-015-dev-phase-simplicity-preference.md) | Dev Phase Simplicity Preference | 已采纳 | 2026-01-16 |
| [ADR-016](./ADR-016-apps-as-containers.md) | Apps as Containers | 已采纳 | 未注明 |
| [ADR-017](./ADR-017-centralized-types.md) | Absolute Type Centralization in Contracts | 已采纳 | 未注明 |
| [ADR-018](./ADR-018-smart-container-application-service-pattern.md) | Smart Container + Application Service Pattern | 已采纳 | 2026-01-18 |
| [ADR-019](./ADR-019-module-extension-strategy.md) | 模块扩展策略 | 已采纳 | 2025-12-08 |
| [ADR-020](./ADR-020-api-server-unified-extraction-strategy.md) | API Server 统一提取策略 | 已采纳 | 2026-01-19 |
| [ADR-021](./ADR-021-api-routes-file-organization-strategy.md) | API 路由文件组织策略 | 已采纳 | 2026-01-19 |
| [ADR-022](./ADR-022-api-module-routing-refactor.md) | API 模块路由重构 | 已采纳 | 2025-01-19 |
| [ADR-023](./ADR-023-server-side-clean-architecture-refactor.md) | Server-Side Layer Decoupling & Pure Dependency Injection | 已采纳 | 2026-01-21 |
| [ADR-024](./ADR-024-application-service-framework-decoupling.md) | ApplicationService 框架解耦方案 | 已采纳 | 2025-01-18 |
| [ADR-025](./ADR-025-module-composition-pattern.md) | Module Composition Pattern | 已采纳 | 2026-01-21 |
| [ADR-026](./ADR-026-server-side-adapter-pattern.md) | Server-Side Adapter Pattern | 已采纳 | 2026-02-19 |
| [ADR-027](./ADR-027-zod-to-openapi-documentation.md) | API Documentation with Zod-to-OpenAPI | 已采纳 | 2026-02-19 |
| [ADR-028](./ADR-028-workspace-package-resolution-strategy.md) | Workspace Package Resolution Strategy | 已采纳 | 2026-03-09 |
| [ADR-029](./ADR-029-main-process-sqlite-access.md) | 主进程 SQLite 直接访问策略 | 已过时 | 2025-12-06 |
| [ADR-030](./ADR-030-standard-result-pattern.md) | Unifying API Responses with Result Pattern | 已采纳 | 2026-01-16 |

## 维护规则

- 规则类 ADR 与实施类 ADR 统一收录在这里，不再使用 `003b`、`007b` 这类旁支编号。
- 历史文档允许保留原始正文结构，但文件名、标题编号和索引状态必须保持一致。
- 文档与代码冲突时，以当前代码、配置和测试为准；ADR 负责保留决策背景，不替代实现事实。
