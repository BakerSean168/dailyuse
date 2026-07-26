---
tags:
  - plan
  - active
description: 进行中的计划目录与当前状态
created: 2026-04-26T00:00:00
updated: 2026-07-26T00:00:00
---

# Active Plans

本目录存放仍在推进中的计划。

## 当前计划

| 计划                                                                                                | 当前状态                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [代码优雅化与后续实施地基](./2026-07-26-codebase-elegance-foundation.md) | **主目标**：Dual Registry + dual 清理 / 路径地图；**PR #189 已合 main**；E5b bootstrap 死域 follow-up；§3.1 |
| [产品时间体系（ADR-037）](./2026-07-26-product-time-system.md) | **一阶段完成 / 二阶段方案**：§9 度量；**§10 下一刀 P1→P11** |
| [产品时间 Goal 提示词](./2026-07-26-product-time-system-goal-prompt.md) | 新会话整段 Goal + 简易提示词；从 W0 开跑 || [夜间 hygiene + Agent Host 持续执行](./2026-07-25-nightly-hygiene-and-agent-host.md) | **执行协议**：GOAL_PRIORITY 对齐 #189 merge 门槛；服务 elegance dual 清理 |
| [统一助手与可插拔 Agent Host](./2026-07-17-unified-assistant-agent-host.md)                         | **实施中**（完成定义未宣称）：统一助手、右侧工作台、Workflow/Turn/Model；产品主能力线                                                                                                       |
| [Auth + Account 收敛与安全闭环](./2026-07-17-auth-account-security-closure.md)                      | **实施中**：A–E 源码闭环；待 e2e 真跑与生产发信                                                                                                                    |
| [Web 登录与注册页面后续优化](./2026-07-15-web-auth-page-optimization.md)                            | **大部分已落地**：访客/主题/校验/找回验证已接；法律文案与远程验收仍待                                                                                         |
| [Web 登录后主要功能内部产品审查](./2026-07-15-web-core-product-review.md)                           | 审查材料：待抽 P0 backlog，不阻塞 elegance                                                                                                                       |
| [Web 登录后工作区产品与设计复审](./2026-07-16-web-product-design-review.md)                         | 第二轮审查：待转化为实施任务                                                                                                                                       |

## 已归档（本轮）

| 计划 | 结果 |
| ---- | ---- |
| [Obsidian Vault 与 GitHub 知识仓库](../archive/2026-07-16-obsidian-vault-repository-optimization.md) | §13.2 **15/15**；PR readiness yes；合 main **#188** |
| [Windows vault-repo residual handoff](../archive/2026-07-25-windows-vault-repo-residual-handoff.md) | Windows 收尾完成；历史 handoff |

## 规则

- 新计划默认放这里
- 文件名使用 `YYYY-MM-DD-topic-slug.md`
- 计划完成、终止或只保留历史参考价值后，移动到 `../archive`
