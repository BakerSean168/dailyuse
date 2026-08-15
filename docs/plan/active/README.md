---
tags:
  - plan
  - active
description: 进行中的计划目录与当前状态
created: 2026-04-26T00:00:00
updated: 2026-08-14T00:00:00Z
---

# Active Plans

本目录存放仍在推进中的计划。

## 当前计划

| 计划                                                                                            | 当前状态                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [CI/CD Platform V2 一次性重构](./2026-08-05-ci-cd-platform-v2-refactor.md)                      | **Architecture implementation and PR cutover complete**：六平面契约、capability workspace、artifact 晋级、run observation；保留以采集长期 timing/fault 运营证据（baseline-v1 待 comparable run） |
| [统一助手与可插拔 Agent Host](./2026-07-17-unified-assistant-agent-host.md)                     | **主产品能力线**：统一助手、右侧工作台、Workflow/Turn/Model；完成定义未宣称                                                                                                                      |
| [夜间 hygiene + Agent Host 持续执行](./2026-07-25-nightly-hygiene-and-agent-host.md)            | **执行协议**：GOAL_PRIORITY 服务 agent-host 切片；门禁与 residual 格式                                                                                                                           |
| [Goal / Task Composition Root 外移](./2026-08-14-goal-task-composition-root-externalization.md) | **Step 1-4 完成**：repository-set ingredient seams、transport instance-bound、API/Desktop host composers 与注入式 repository consumers 落地；Step 5（docs/surface lock）进行中                   |

## 本轮已归档（2026-08-15）

| 计划                                                                                                       | 结果                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RefArch Phase 2：统一 Request/Execution Context](../archive/2026-08-15-refarch-phase2-request-context.md) | Steps 1-5 完成：canonical ExecutionContext、RequestContext middleware、governance-first adapter 试点、Principal ordering、AI→Python requestId 透传、SSE/smoke/inventory/docs 封口；详见计划内 gate 记录 |
| [RefArch Phase 1：P0 分层](../archive/2026-08-15-refarch-phase1-p0-layering.md)                            | 4 steps + 4 review rounds PASS：governance 试点、@prisma/client 边界、API runtime composer、phase1 docs/audit 闭合                                                                                      |

## 本轮已归档（2026-08-08）

| 计划                                                                                                 | 结果                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [基础 UI 与 Shell 重构](../archive/2026-08-06-ui-foundation-and-shell-refactor.md)                   | 三栏最小宽度与拖拽收缩、compound capsule/摘要入口、设置页扁平化；local-docker 产品旅程 7/7 通过，验收 6/6 勾选                                                                              |
| [基础 UI 与桌面 Shell 后续优化](../archive/2026-08-06-ui-foundation-shell-follow-up-optimization.md) | 场景生命周期、统一导航意图、Tab/KeepAlive、单一滚动宿主、设置桌面导航与模块骨架；commit 784fb9f6 落地，Phase 0-5 全勾选                                                                     |
| [业务闭环与模块边界重构 R0-R7](../archive/2026-08-07-business-loop-and-module-boundary-rebuild.md)   | R0 可观测 → R7 全部实施：乐观锁、outbox 单通道、ScheduleLease/claim、Reminder/Notification、Habit/Relation/AI/Activity/Wallet；commit d60e6eaf8 + local-docker e2e 7/7 + PR #211 19/19 全绿 |
| [业务重构 findings 追踪（R0-5）](../archive/2026-08-07-business-loop-findings-tracking.md)           | 全部 finding 状态同步为 done/wip→done；P0-01/P0-04/R2-5 落地证据回填                                                                                                                        |

## 本轮已归档（2026-08-03）

| 计划                                                                                                              | 结果                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Desktop Cloud Connection Boundary Refactor](../archive/2026-08-03-desktop-cloud-connection-boundary-refactor.md) | Profile Access、Cloud Connection Dialog 与可选 PIN 解耦完成；Desktop E2E 2/2 与全仓 validation 通过                       |
| [Desktop GitHub Device Authorization](../archive/2026-08-03-desktop-github-device-authorization.md)               | Better Auth device flow、Web 显式批准、Desktop main 协调器、guest 原地 adoption 与离线重开完成；prod-like validation 通过 |
| [Desktop Profile 与云端认证一次性重写](../archive/2026-08-02-desktop-profile-and-cloud-auth-rewrite.md)           | Better Auth + Profile/Unlock 单轨完成；旧认证内核删除；Desktop E2E 与全仓 prod-like validation 通过                       |
| [Reka UI、Goal 一致性与桌面工作区长期重构](../archive/2026-08-01-reka-goal-consistency-and-workspace-refactor.md) | W0–W10 完成；Docker 旅程 7/7、Electron 布局矩阵、原子写入/可靠贡献/单导航与无障碍门槛通过                                 |
| [三轮 Docker 构建优化](../archive/2026-07-31-three-round-docker-build-optimization.md)                            | 三轮完成；API 镜像减少 30.9%，独立 migrator、isolated builder、显式生产依赖边界与 BuildKit cache 均通过 prod-like 验证    |
| [API Runtime 镜像裁剪](../archive/2026-07-31-api-runtime-image-pruning.md)                                        | runtime 使用生产依赖闭包；镜像减少约 70.4%；六服务 healthy，启动链与治理检查通过                                          |
| [最新 main 本机 Docker 产品复审](../archive/2026-07-31-latest-local-docker-product-review.md)                     | 六服务 healthy；部署阻塞已修；非 AI 与 AI 桌面复审 findings 见 `docs/audit/2026-07-31-local-docker-product-review.md`     |
| [本机 Docker 核心产品审查与优化](../archive/2026-07-29-local-docker-core-product-optimization.md)                 | Phase A–E 与第 10 节全通过；Docker PM journey 7/7、Electron 壳层 8/8、最终 validation pass                                |
| [MemoFlow 产品身份迁移](../archive/2026-07-29-memoflow-identity-migration.md)                                     | 仓库、源码、部署与文档标识统一；identity audit 已纳入治理门禁                                                             |
| [事务邮件通用 SMTP](../archive/2026-07-28-transactional-email-smtp.md)                                            | Phase A–D 实施完成；默认 console；指南见 `docs/guides/development/transactional-email-smtp.md`                            |
| [Docker Web PM 旅程 findings](../archive/2026-07-27-docker-web-pm-journey-findings.md)                            | 旅程记录；i18n/熔断/取码/SMTP 修复已入代码                                                                                |
| [Import Path Elegance](../archive/2026-07-27-import-path-elegance.md)                                             | 包内 `@/` → 相对路径完成；政策 `import-path-policy.md`                                                                    |
| [产品时间体系 ADR-037](../archive/2026-07-26-product-time-system.md)                                              | W0–W8 + P1–P11 完成（#191/#192）                                                                                          |
| [产品时间 Goal 提示词](../archive/2026-07-26-product-time-system-goal-prompt.md)                                  | 随时间 plan 归档                                                                                                          |
| [代码优雅化地基](../archive/2026-07-26-codebase-elegance-foundation.md)                                           | E1–E7；#189/#190 已合                                                                                                     |
| [Auth + Account 安全闭环](../archive/2026-07-17-auth-account-security-closure.md)                                 | A–E 源码闭环；投递见 SMTP archive                                                                                         |
| [Web 登录页优化](../archive/2026-07-15-web-auth-page-optimization.md)                                             | 主项已落地；残余法律文案/e2e                                                                                              |
| [Web 核心产品审查](../archive/2026-07-15-web-core-product-review.md)                                              | 审查历史材料                                                                                                              |
| [Web 产品设计复审](../archive/2026-07-16-web-product-design-review.md)                                            | 审查历史材料                                                                                                              |
| [Obsidian Vault 与 GitHub 知识仓库](../archive/2026-07-16-obsidian-vault-repository-optimization.md)              | §13.2 **15/15**；合 main **#188**                                                                                         |
| [Windows vault-repo residual handoff](../archive/2026-07-25-windows-vault-repo-residual-handoff.md)               | Windows 收尾完成；历史 handoff                                                                                            |

## 规则

- 新计划默认放这里
- 文件名使用 `YYYY-MM-DD-topic-slug.md`
- 计划完成、终止或只保留历史参考价值后，移动到 `../archive`
